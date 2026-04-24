// Behavior tests — verifies business logic, not just status codes.
import { PrismaClient } from "../generated/prisma/index.js";

const BASE = "http://localhost:3000";
const prisma = new PrismaClient();
const results = [];

function pass(n, note = "") {
  results.push({ n, ok: true });
  console.log(`✅ ${n}${note ? " — " + note : ""}`);
}
function fail(n, note) {
  results.push({ n, ok: false, note });
  console.log(`❌ ${n} — ${note}`);
}

async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "admin123" }),
  });
  const cookie = res.headers.get("set-cookie") ?? "";
  const m = cookie.match(/glimmora_session=([^;]+)/);
  return m ? `glimmora_session=${m[1]}` : null;
}

async function run() {
  // --- 1. CITY_ADMIN sees only their city's drivers ---
  {
    const cookie = await login("rewa.admin@glimmora.ai");
    const res = await fetch(`${BASE}/drivers`, { headers: { cookie } });
    const html = await res.text();
    // seed: Rewa drivers Rajesh (9876501001), Suresh (9876501002)
    //       Indore drivers Amit (9876501003), Ramesh (9876501004)
    const hasRewaDriver = html.includes("9876501001") || html.includes("Rajesh");
    const hasIndoreDriver = html.includes("9876501003") || html.includes("Amit");
    if (hasRewaDriver && !hasIndoreDriver)
      pass("CITY_ADMIN sees only Rewa drivers");
    else
      fail(
        "CITY_ADMIN scoping",
        `rewaDriver=${hasRewaDriver} indoreDriver=${hasIndoreDriver}`
      );
  }

  // --- 2. SUPER_ADMIN sees ALL drivers ---
  {
    const cookie = await login("admin@glimmora.ai");
    const res = await fetch(`${BASE}/drivers`, { headers: { cookie } });
    const html = await res.text();
    const hasRewa = html.includes("Rajesh");
    const hasIndore = html.includes("Amit");
    if (hasRewa && hasIndore) pass("SUPER_ADMIN sees all drivers");
    else fail("SUPER_ADMIN sees all drivers", `rewa=${hasRewa} indore=${hasIndore}`);
  }

  // --- 3. VERIFIER only sees PENDING drivers ---
  {
    const cookie = await login("verifier@glimmora.ai");
    const res = await fetch(`${BASE}/drivers`, { headers: { cookie } });
    const html = await res.text();
    // Query DB: gather phones of all APPROVED drivers. None of those
    // should appear on the page; at least one PENDING phone should.
    const approved = await prisma.driver.findMany({
      where: { status: "APPROVED" },
      select: { phone: true },
    });
    const pending = await prisma.driver.findMany({
      where: { status: "PENDING" },
      select: { phone: true },
    });
    const leakedApproved = approved.filter((d) => html.includes(d.phone));
    const visiblePending = pending.filter((d) => html.includes(d.phone));
    if (visiblePending.length > 0 && leakedApproved.length === 0)
      pass(
        "VERIFIER only sees PENDING drivers",
        `pending=${visiblePending.length} leaked=${leakedApproved.length}`
      );
    else
      fail(
        "VERIFIER PENDING filter",
        `pending=${visiblePending.length} leaked=${leakedApproved.length}`
      );
  }

  // --- 4. Sidebar filters by role ---
  {
    const cookie = await login("verifier@glimmora.ai");
    const res = await fetch(`${BASE}/drivers`, { headers: { cookie } });
    const html = await res.text();
    // Verifier should see Drivers link but not Coupons/Cities/Reports
    const hasDrivers = html.includes(">Drivers<");
    const hasCoupons = html.includes(">Coupons<");
    if (hasDrivers && !hasCoupons) pass("VERIFIER sidebar filtered");
    else fail("VERIFIER sidebar", `drivers=${hasDrivers} coupons=${hasCoupons}`);
  }

  // --- 5. Public track page loads for a real token ---
  let token = null;
  let rideId = null;
  {
    const ride = await prisma.ride.findFirst();
    if (!ride) {
      fail("track: no seed ride", "cannot test");
    } else {
      rideId = ride.id;
      const cookie = await login("admin@glimmora.ai");
      const res = await fetch(`${BASE}/api/rides/${rideId}/token`, {
        method: "POST",
        headers: { cookie },
      });
      const data = await res.json();
      if (res.ok && data.token) {
        token = data.token;
        pass("token generation", `len=${token.length}`);
      } else {
        fail("token generation", JSON.stringify(data));
      }
    }
  }

  // --- 6. Public track page renders without auth ---
  if (token) {
    const res = await fetch(`${BASE}/track/${token}`);
    const html = await res.text();
    if (
      res.status === 200 &&
      html.includes("Glimmora Go") &&
      html.includes("Live ride tracking")
    )
      pass("public /track/[token] renders");
    else fail("public /track render", `status=${res.status}`);
  }

  // --- 7. Public /api/track/[token] returns ride shape ---
  if (token) {
    const res = await fetch(`${BASE}/api/track/${token}`);
    const data = await res.json();
    if (
      res.ok &&
      data.status &&
      data.pickup?.lat &&
      data.drop?.lat &&
      data.city
    )
      pass("public /api/track returns ride", `status=${data.status}`);
    else fail("public /api/track", JSON.stringify(data));
  }

  // --- 8. Token is reused, not regenerated ---
  if (rideId && token) {
    const cookie = await login("admin@glimmora.ai");
    const res = await fetch(`${BASE}/api/rides/${rideId}/token`, {
      method: "POST",
      headers: { cookie },
    });
    const data = await res.json();
    if (data.token === token) pass("token POST is idempotent");
    else fail("token idempotency", `new=${data.token?.slice(0, 8)}`);
  }

  // --- 9. CITY_ADMIN cannot write to a city outside their scope ---
  {
    const cookie = await login("rewa.admin@glimmora.ai");
    const indore = await prisma.city.findUnique({ where: { name: "Indore" } });
    if (!indore) {
      fail("city scoping test setup", "no Indore city");
    } else {
      const res = await fetch(`${BASE}/api/cities/${indore.id}/fare`, {
        method: "PUT",
        headers: { cookie, "Content-Type": "application/json" },
        body: JSON.stringify({
          baseFare: 999,
          perKm: 99,
          perMin: 9,
          minimumFare: 99,
        }),
      });
      if (res.status === 403) pass("CITY_ADMIN blocked on other city's fare");
      else fail("CITY_ADMIN cross-city fare PUT", `got ${res.status}`);
    }
  }

  // --- 10. Referral reward automation ---
  {
    // Set up: make Suresh a referred driver of Rajesh, give Suresh 9 completed
    // rides, then complete one more via the API and verify Rajesh's
    // subscriptionUntil got extended by 7 days.
    const rajesh = await prisma.driver.findUnique({
      where: { phone: "9876501001" },
    });
    const suresh = await prisma.driver.findUnique({
      where: { phone: "9876501002" },
    });
    const rewa = await prisma.city.findUnique({ where: { name: "Rewa" } });
    const rider = await prisma.rider.findFirst();
    if (!rajesh || !suresh || !rewa || !rider) {
      fail("reward setup", "missing seed data");
    } else {
      // Reset
      await prisma.driver.update({
        where: { id: suresh.id },
        data: {
          referredById: rajesh.id,
          status: "APPROVED",
          referralRewardGranted: false,
        },
      });
      const priorSubUntil = new Date("2026-01-01");
      await prisma.driver.update({
        where: { id: rajesh.id },
        data: { subscriptionUntil: priorSubUntil },
      });

      // Clear Suresh's existing rides, then create 9 COMPLETED ones.
      await prisma.ride.deleteMany({ where: { driverId: suresh.id } });
      for (let i = 0; i < 9; i++) {
        await prisma.ride.create({
          data: {
            riderId: rider.id,
            driverId: suresh.id,
            cityId: rewa.id,
            pickupAddress: `Seed ${i}`,
            pickupLat: 24.5,
            pickupLng: 81.3,
            dropAddress: `Seed drop ${i}`,
            dropLat: 24.51,
            dropLng: 81.31,
            fareEstimate: 50,
            fareFinal: 50,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      }

      // Create one more IN_TRIP ride and complete it via the admin API.
      const lastRide = await prisma.ride.create({
        data: {
          riderId: rider.id,
          driverId: suresh.id,
          cityId: rewa.id,
          pickupAddress: "Seed last",
          pickupLat: 24.5,
          pickupLng: 81.3,
          dropAddress: "Seed last drop",
          dropLat: 24.51,
          dropLng: 81.31,
          fareEstimate: 50,
          fareFinal: 50,
          status: "IN_TRIP",
        },
      });
      const cookie = await login("admin@glimmora.ai");
      const res = await fetch(`${BASE}/api/rides/${lastRide.id}`, {
        method: "PATCH",
        headers: { cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "COMPLETE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        fail("reward: complete ride", JSON.stringify(data));
      } else if (data.rewardGranted !== true) {
        fail("reward: rewardGranted flag", `rewardGranted=${data.rewardGranted}`);
      } else {
        const updatedRajesh = await prisma.driver.findUnique({
          where: { id: rajesh.id },
        });
        const updatedSuresh = await prisma.driver.findUnique({
          where: { id: suresh.id },
        });
        // Teardown: restore Suresh to PENDING + no referrer, so follow-up test
        // runs that scan for PENDING drivers don't see the flipped state.
        await prisma.ride.deleteMany({ where: { driverId: suresh.id } });
        await prisma.driver.update({
          where: { id: suresh.id },
          data: {
            status: "PENDING",
            referredById: null,
            referralRewardGranted: false,
          },
        });
        await prisma.driver.update({
          where: { id: rajesh.id },
          data: { subscriptionUntil: null },
        });
        const expected = new Date(priorSubUntil);
        expected.setDate(expected.getDate() + 7);
        // Because priorSubUntil is in the past, the engine uses "now" as base
        // instead. So just verify it's >= 6 days from now and referralRewardGranted=true.
        const now = new Date();
        const sixDaysFromNow = new Date(now);
        sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
        if (
          updatedSuresh.referralRewardGranted &&
          updatedRajesh.subscriptionUntil &&
          updatedRajesh.subscriptionUntil > sixDaysFromNow
        )
          pass(
            "referral reward granted",
            `extended to ${updatedRajesh.subscriptionUntil.toISOString().slice(0, 10)}`
          );
        else
          fail(
            "referral reward",
            `granted=${updatedSuresh.referralRewardGranted} until=${updatedRajesh.subscriptionUntil}`
          );
      }
    }
  }

  // --- 11. Archetype defaults are actually applied when creating a city ---
  {
    const cookie = await login("admin@glimmora.ai");
    // Set a distinctive value on METRO defaults
    await fetch(`${BASE}/api/archetypes/METRO`, {
      method: "PUT",
      headers: { cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        matchingRadiusKm: 2.5,
        surgeMultiplier: 1.4,
        paymentOptions: ["CASH", "UPI", "CARD"],
        baseFare: 55,
        perKm: 17,
        perMin: 2,
        minimumFare: 75,
      }),
    });
    const name = "SmokeCity" + Date.now();
    const res = await fetch(`${BASE}/api/cities`, {
      method: "POST",
      headers: { cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ name, state: "X", archetype: "METRO" }),
    });
    const data = await res.json();
    if (res.ok && data.city) {
      const full = await prisma.city.findUnique({
        where: { id: data.city.id },
        include: { fareConfig: true },
      });
      if (
        full.matchingRadiusKm === 2.5 &&
        full.surgeMultiplier === 1.4 &&
        full.fareConfig.baseFare === 55
      )
        pass("archetype defaults applied to new city");
      else
        fail(
          "archetype applied",
          `radius=${full.matchingRadiusKm} surge=${full.surgeMultiplier} base=${full.fareConfig.baseFare}`
        );
      // cleanup
      await prisma.fareConfig.delete({ where: { cityId: full.id } });
      await prisma.city.delete({ where: { id: full.id } });
    } else {
      fail("archetype city create", JSON.stringify(data));
    }
  }

  // --- 12. SOS sidebar endpoint counts correctly ---
  {
    const rewa = await prisma.city.findUnique({ where: { name: "Rewa" } });
    const rider = await prisma.rider.findFirst();
    const ride = await prisma.ride.create({
      data: {
        riderId: rider.id,
        cityId: rewa.id,
        pickupAddress: "SOS test pickup",
        pickupLat: 24.5,
        pickupLng: 81.3,
        dropAddress: "SOS test drop",
        dropLat: 24.51,
        dropLng: 81.31,
        fareEstimate: 50,
        status: "IN_TRIP",
        sosTriggered: true,
      },
    });
    const cookie = await login("admin@glimmora.ai");
    const res = await fetch(`${BASE}/api/sos`, { headers: { cookie } });
    const data = await res.json();
    if (res.ok && data.count >= 1) pass("SOS count includes active event");
    else fail("SOS count", JSON.stringify(data));
    await prisma.ride.delete({ where: { id: ride.id } });
  }

  // --- Summary ---
  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(
    `═══ ${results.length - failed.length} / ${results.length} behavior tests passed ═══`
  );
  if (failed.length) {
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error("Crashed:", e.stack ?? e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
