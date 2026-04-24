import { prisma } from "./db";

export const REWARD_THRESHOLD = 10;
export const REWARD_DAYS = 7;

/**
 * Checks whether the given driver, after completing a ride, qualifies their
 * referrer for a free-subscription-days reward. Extends the referrer's
 * subscriptionUntil and marks the referee as rewarded so we don't double-pay.
 * Returns true if a reward was granted.
 */
export async function maybeGrantReferralReward(driverId: string): Promise<boolean> {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      id: true,
      referredById: true,
      referralRewardGranted: true,
    },
  });
  if (!driver || !driver.referredById || driver.referralRewardGranted) {
    return false;
  }

  const completedCount = await prisma.ride.count({
    where: { driverId, status: "COMPLETED" },
  });
  if (completedCount < REWARD_THRESHOLD) return false;

  const referrer = await prisma.driver.findUnique({
    where: { id: driver.referredById },
    select: { id: true, subscriptionUntil: true },
  });
  if (!referrer) return false;

  const base =
    referrer.subscriptionUntil && referrer.subscriptionUntil > new Date()
      ? referrer.subscriptionUntil
      : new Date();
  const extended = new Date(base);
  extended.setDate(extended.getDate() + REWARD_DAYS);

  await prisma.$transaction([
    prisma.driver.update({
      where: { id: referrer.id },
      data: { subscriptionUntil: extended },
    }),
    prisma.driver.update({
      where: { id: driver.id },
      data: { referralRewardGranted: true },
    }),
  ]);

  return true;
}

/**
 * Scans every referred driver and grants rewards for any who've already
 * crossed the threshold. Safe to run repeatedly — maybeGrantReferralReward
 * no-ops on already-rewarded drivers.
 */
export async function recomputeReferralRewards(): Promise<number> {
  const candidates = await prisma.driver.findMany({
    where: { referredById: { not: null }, referralRewardGranted: false },
    select: { id: true },
  });
  let granted = 0;
  for (const c of candidates) {
    if (await maybeGrantReferralReward(c.id)) granted++;
  }
  return granted;
}
