// Kirana PWA flow test — signup → pending gate → admin approves → OTP login →
// fare estimate → book → bookings list → commission attribution.
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

async function run() {
  // Use a throwaway phone number for this run
  const phone = "9000" + String(Date.now()).slice(-6);
  const rewa = await prisma.city.findUnique({ where: { name: "Rewa" } });
  if (!rewa) {
    fail("setup: Rewa city", "missing");
    process.exit(1);
  }

  // --- 1. Signup creates a PENDING partner ---
  {
    const res = await fetch(`${BASE}/api/kirana/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        shopName: "Test Shop " + phone.slice(-4),
        ownerName: "Test Owner",
        cityId: rewa.id,
      }),
    });
    const data = await res.json();
    if (res.ok && data.partner?.status === "PENDING")
      pass("signup → PENDING partner", data.partner.id.slice(0, 8));
    else fail("signup", JSON.stringify(data));
  }

  // --- 2. OTP request for an unknown phone → 404 ---
  {
    const res = await fetch(`${BASE}/api/kirana/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0000000000" }),
    });
    if (res.status === 404) pass("OTP request → 404 for unknown phone");
    else fail("OTP unknown phone", `status=${res.status}`);
  }

  // --- 3. OTP request + verify for PENDING partner succeeds (sets session) ---
  let kiranaCookie;
  {
    const req = await fetch(`${BASE}/api/kirana/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const reqData = await req.json();
    if (!reqData.devCode) {
      fail("OTP devCode missing", "expected dev-mode devCode");
      return;
    }
    const verify = await fetch(`${BASE}/api/kirana/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: reqData.devCode }),
    });
    const vData = await verify.json();
    if (verify.ok && vData.status === "PENDING") {
      pass("OTP verify (pending partner)", `status=${vData.status}`);
      kiranaCookie = cookieFromResponse(verify);
    } else fail("OTP verify", JSON.stringify(vData));
  }

  // --- 4. Pending partner hitting /k sees PendingGate, not the dashboard ---
  {
    const res = await fetch(`${BASE}/k`, { headers: { cookie: kiranaCookie } });
    const html = await res.text();
    if (html.includes("Awaiting approval"))
      pass("Pending gate blocks dashboard");
    else fail("Pending gate", `didn't render approval-pending screen`);
  }

  // --- 5. Pending partner can't book ---
  {
    const res = await fetch(`${BASE}/api/kirana/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: kiranaCookie },
      body: JSON.stringify({
        riderPhone: "9999900000",
        pickupAddress: "a",
        pickupLat: 24.5,
        pickupLng: 81.3,
        dropAddress: "b",
        dropLat: 24.52,
        dropLng: 81.32,
      }),
    });
    if (res.status === 403) pass("Pending partner blocked from booking");
    else fail("Pending booking", `got ${res.status}`);
  }

  // --- 6. Admin approves the partner ---
  let partnerId;
  {
    const partner = await prisma.kiranaPartner.findUnique({ where: { phone } });
    partnerId = partner.id;
    const adminCookie = await adminLogin();
    const res = await fetch(`${BASE}/api/partners/${partnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ status: "APPROVED", commissionPct: 15 }),
    });
    const data = await res.json();
    if (res.ok && data.partner.status === "APPROVED" && data.partner.commissionPct === 15)
      pass("Admin approved partner + set commission");
    else fail("admin approve", JSON.stringify(data));
  }

  // --- 7. Fare estimate (without creating a ride) ---
  {
    const res = await fetch(`${BASE}/api/kirana/bookings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: kiranaCookie },
      body: JSON.stringify({
        pickupLat: 24.5336,
        pickupLng: 81.3035,
        dropLat: 24.5421,
        dropLng: 81.2956,
        concession: "NONE",
      }),
    });
    const data = await res.json();
    if (res.ok && data.fareEstimate > 0 && data.commissionEstimate > 0)
      pass(
        "Fare estimate",
        `fare=₹${data.fareEstimate} commission=₹${data.commissionEstimate} (${data.distanceKm}km)`
      );
    else fail("fare estimate", JSON.stringify(data));
  }

  // --- 8. Now approved → create real booking ---
  let bookingId;
  {
    const res = await fetch(`${BASE}/api/kirana/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: kiranaCookie },
      body: JSON.stringify({
        riderPhone: "9999911111",
        riderName: "Test Rider",
        pickupAddress: "Rewa Station",
        pickupLat: 24.5336,
        pickupLng: 81.3035,
        dropAddress: "Civil Hospital",
        dropLat: 24.5421,
        dropLng: 81.2956,
        concession: "WOMEN",
      }),
    });
    const data = await res.json();
    if (res.ok && data.ride?.id && data.ride.status === "REQUESTED") {
      bookingId = data.ride.id;
      pass(
        "Booking created",
        `fare=₹${data.ride.fareEstimate} distance=${data.ride.distanceKm}km`
      );
    } else fail("booking create", JSON.stringify(data));
  }

  // --- 9. Booking visible in partner dashboard + shows bookingChannel=KIRANA ---
  {
    const row = await prisma.ride.findUnique({
      where: { id: bookingId },
      select: { bookingChannel: true, bookedByPartnerId: true, concessionType: true },
    });
    if (
      row.bookingChannel === "KIRANA" &&
      row.bookedByPartnerId === partnerId &&
      row.concessionType === "WOMEN"
    )
      pass("Booking tagged to partner + channel=KIRANA + concession=WOMEN");
    else fail("booking attribution", JSON.stringify(row));
  }

  // --- 10. Admin completes the ride → partner commission accrues ---
  {
    const adminCookie = await adminLogin();
    const res = await fetch(`${BASE}/api/rides/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ action: "COMPLETE" }),
    });
    const data = await res.json();
    if (res.ok && data.ride.status === "COMPLETED") pass("Ride completed by admin");
    else fail("ride complete", JSON.stringify(data));
  }

  // --- 11. Partner's bookings page lists the ride with commission shown ---
  {
    const res = await fetch(`${BASE}/k/bookings`, {
      headers: { cookie: kiranaCookie },
    });
    const html = await res.text();
    if (html.includes("Earned ₹") && html.includes("9999911111"))
      pass("Partner bookings page shows commission + customer");
    else fail("bookings page render", "missing commission or rider phone");
  }

  // --- 12. Logout clears the cookie ---
  {
    const res = await fetch(`${BASE}/api/kirana/logout`, {
      method: "POST",
      headers: { cookie: kiranaCookie },
    });
    const after = await fetch(`${BASE}/k`, {
      headers: { cookie: cookieFromResponse(res) },
      redirect: "manual",
    });
    if (after.status === 307) pass("Logout redirects back to login");
    else fail("logout", `status=${after.status}`);
  }

  // --- Cleanup ---
  await prisma.ride.deleteMany({ where: { bookedByPartnerId: partnerId } });
  await prisma.kiranaPartner.delete({ where: { id: partnerId } });

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(
    `═══ ${results.length - failed.length} / ${results.length} kirana tests passed ═══`
  );
  if (failed.length) process.exit(1);
}

run()
  .catch((e) => {
    console.error("Crashed:", e.stack ?? e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
