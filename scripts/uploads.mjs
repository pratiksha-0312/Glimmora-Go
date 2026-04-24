// Upload flow tests — driver docs (admin side) + partner docs (kirana side).
// Assumes dev server at localhost:3000 with the seed loaded.
import { PrismaClient } from "../generated/prisma/index.js";

const BASE = "http://localhost:3000";
const prisma = new PrismaClient();
const results = [];
const pass = (n, note = "") => {
  results.push({ n, ok: true });
  console.log(`✅ ${n}${note ? " — " + note : ""}`);
};
const fail = (n, note) => {
  results.push({ n, ok: false, note });
  console.log(`❌ ${n} — ${note}`);
};

function cookieFromResponse(res) {
  const raw = res.headers.get("set-cookie") ?? "";
  return raw.split(",").map((c) => c.split(";")[0].trim()).join("; ");
}

async function adminLogin(email = "admin@glimmora.ai") {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "admin123" }),
  });
  return cookieFromResponse(res);
}

// Fake PDF-ish file for uploads
function makeFile(name, bytes = 1024) {
  const content = new Uint8Array(bytes).fill(65); // 'A'
  return new File([content], name, { type: "application/pdf" });
}

async function run() {
  // ---------- DRIVER DOCS (admin side) ----------
  const driver = await prisma.driver.findFirst({
    where: { status: "PENDING" },
  });
  if (!driver) {
    fail("setup: pending driver", "no pending driver in seed");
    process.exit(1);
  }

  const adminCookie = await adminLogin();

  // --- 1. Admin uploads a driver document ---
  let driverDocId;
  {
    const form = new FormData();
    form.append("file", makeFile("license.pdf", 2048));
    form.append("driverId", driver.id);
    form.append("type", "LICENSE");
    const res = await fetch(`${BASE}/api/uploads/driver-doc`, {
      method: "POST",
      body: form,
      headers: { cookie: adminCookie },
    });
    const data = await res.json();
    if (res.ok && data.document?.id && data.document.status === "PENDING") {
      driverDocId = data.document.id;
      pass("driver doc uploaded", `url=${data.document.fileUrl}`);
    } else {
      fail("driver upload", JSON.stringify(data));
    }
  }

  // --- 2. Unauth upload rejected ---
  {
    const form = new FormData();
    form.append("file", makeFile("nope.pdf"));
    form.append("driverId", driver.id);
    form.append("type", "LICENSE");
    const res = await fetch(`${BASE}/api/uploads/driver-doc`, {
      method: "POST",
      body: form,
      redirect: "manual",
    });
    if (res.status === 307 || res.status === 401)
      pass("unauth driver upload rejected", `status=${res.status}`);
    else fail("unauth driver upload", `status=${res.status}`);
  }

  // --- 3. Bad file type rejected ---
  {
    const form = new FormData();
    form.append(
      "file",
      new File(["exe"], "hack.exe", { type: "application/x-msdownload" })
    );
    form.append("driverId", driver.id);
    form.append("type", "LICENSE");
    const res = await fetch(`${BASE}/api/uploads/driver-doc`, {
      method: "POST",
      body: form,
      headers: { cookie: adminCookie },
    });
    if (res.status === 400) pass("bad file type rejected");
    else fail("bad type", `status=${res.status}`);
  }

  // --- 4. VERIFIER can upload driver docs ---
  {
    const verifCookie = await adminLogin("verifier@glimmora.ai");
    const form = new FormData();
    form.append("file", makeFile("verifier-upload.pdf"));
    form.append("driverId", driver.id);
    form.append("type", "AADHAAR");
    const res = await fetch(`${BASE}/api/uploads/driver-doc`, {
      method: "POST",
      body: form,
      headers: { cookie: verifCookie },
    });
    if (res.ok) pass("VERIFIER can upload driver docs");
    else fail("verifier upload", `status=${res.status}`);
  }

  // --- 5. VIEWER cannot upload ---
  {
    const viewCookie = await adminLogin("viewer@glimmora.ai");
    const form = new FormData();
    form.append("file", makeFile("viewer.pdf"));
    form.append("driverId", driver.id);
    form.append("type", "LICENSE");
    const res = await fetch(`${BASE}/api/uploads/driver-doc`, {
      method: "POST",
      body: form,
      headers: { cookie: viewCookie },
    });
    if (res.status === 403) pass("VIEWER blocked from upload");
    else fail("viewer upload", `status=${res.status}`);
  }

  // --- 6. Admin approves the doc, then deletes it ---
  {
    const approve = await fetch(
      `${BASE}/api/drivers/${driver.id}/documents/${driverDocId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: adminCookie },
        body: JSON.stringify({ status: "APPROVED", reviewNote: "ok" }),
      }
    );
    const data = await approve.json();
    if (approve.ok && data.document.status === "APPROVED")
      pass("driver doc approved");
    else fail("doc approve", JSON.stringify(data));

    const del = await fetch(
      `${BASE}/api/drivers/${driver.id}/documents/${driverDocId}`,
      { method: "DELETE", headers: { cookie: adminCookie } }
    );
    if (del.ok) pass("driver doc deleted");
    else fail("doc delete", `status=${del.status}`);
  }

  // ---------- PARTNER DOCS (kirana side) ----------
  const approvedPartner = await prisma.kiranaPartner.findFirst({
    where: { status: "APPROVED" },
  });
  if (!approvedPartner) {
    fail("setup: approved partner", "no approved partner in seed");
    process.exit(1);
  }

  // Log the partner in via OTP
  const otpReq = await fetch(`${BASE}/api/kirana/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: approvedPartner.phone }),
  });
  const { devCode } = await otpReq.json();
  const otpVerify = await fetch(`${BASE}/api/kirana/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: approvedPartner.phone, code: devCode }),
  });
  const partnerCookie = cookieFromResponse(otpVerify);

  // --- 7. Partner uploads a document ---
  let partnerDocId;
  {
    const form = new FormData();
    form.append("file", makeFile("shop-license.pdf", 1500));
    form.append("type", "SHOP_LICENSE");
    const res = await fetch(`${BASE}/api/kirana/documents`, {
      method: "POST",
      body: form,
      headers: { cookie: partnerCookie },
    });
    const data = await res.json();
    if (res.ok && data.document?.id) {
      partnerDocId = data.document.id;
      pass("partner doc uploaded", `type=${data.document.type}`);
    } else fail("partner upload", JSON.stringify(data));
  }

  // --- 8. Partner can't upload with no session ---
  {
    const form = new FormData();
    form.append("file", makeFile("anon.pdf"));
    form.append("type", "AADHAAR");
    const res = await fetch(`${BASE}/api/kirana/documents`, {
      method: "POST",
      body: form,
      redirect: "manual",
    });
    if (res.status === 401 || res.status === 307)
      pass("unauth partner upload rejected", `status=${res.status}`);
    else fail("anon partner upload", `status=${res.status}`);
  }

  // --- 9. Partner can delete own PENDING doc ---
  {
    const res = await fetch(
      `${BASE}/api/kirana/documents/${partnerDocId}`,
      { method: "DELETE", headers: { cookie: partnerCookie } }
    );
    if (res.ok) pass("partner self-delete pending doc");
    else fail("partner self-delete", `status=${res.status}`);
  }

  // --- 10. Re-upload, admin approves, then partner can't self-delete ---
  {
    const form = new FormData();
    form.append("file", makeFile("pan.pdf", 600));
    form.append("type", "PAN");
    const upload = await fetch(`${BASE}/api/kirana/documents`, {
      method: "POST",
      body: form,
      headers: { cookie: partnerCookie },
    });
    const { document } = await upload.json();
    const approve = await fetch(
      `${BASE}/api/partners/${approvedPartner.id}/documents/${document.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: adminCookie },
        body: JSON.stringify({ status: "APPROVED" }),
      }
    );
    if (!approve.ok) {
      fail("admin approve partner doc", `status=${approve.status}`);
    } else pass("admin approved partner doc");

    const del = await fetch(`${BASE}/api/kirana/documents/${document.id}`, {
      method: "DELETE",
      headers: { cookie: partnerCookie },
    });
    if (del.status === 400) pass("partner can't delete approved doc");
    else fail("approved-protected", `status=${del.status}`);

    // Admin can still delete it
    const adminDel = await fetch(
      `${BASE}/api/partners/${approvedPartner.id}/documents/${document.id}`,
      { method: "DELETE", headers: { cookie: adminCookie } }
    );
    if (adminDel.ok) pass("admin can delete approved partner doc");
    else fail("admin delete", `status=${adminDel.status}`);
  }

  // --- 11. Admin partner detail page renders with uploaded docs ---
  {
    const form = new FormData();
    form.append("file", makeFile("aadhaar.pdf"));
    form.append("type", "AADHAAR");
    const uploadRes = await fetch(`${BASE}/api/kirana/documents`, {
      method: "POST",
      body: form,
      headers: { cookie: partnerCookie },
    });
    const { document: newDoc } = await uploadRes.json();

    const page = await fetch(`${BASE}/partners/${approvedPartner.id}`, {
      headers: { cookie: adminCookie },
    });
    const html = await page.text();
    if (html.includes("AADHAAR") && html.includes("KYC documents"))
      pass("admin partner detail page shows uploaded doc");
    else fail("admin detail render", "AADHAAR or 'KYC documents' not found");

    // cleanup
    await fetch(
      `${BASE}/api/partners/${approvedPartner.id}/documents/${newDoc.id}`,
      { method: "DELETE", headers: { cookie: adminCookie } }
    );
  }

  // Cleanup: wipe any leftover docs for this test driver / partner
  await prisma.driverDocument.deleteMany({ where: { driverId: driver.id } });

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(
    `═══ ${results.length - failed.length} / ${results.length} upload tests passed ═══`
  );
  if (failed.length) process.exit(1);
}

run()
  .catch((e) => {
    console.error("Crashed:", e.stack ?? e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
