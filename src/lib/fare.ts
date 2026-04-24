export type FareInput = {
  baseFare: number;
  perKm: number;
  perMin: number;
  minimumFare: number;
  surgeMultiplier: number;
  distanceKm: number;
  durationMin: number;
  concession?:
    | { type: "WOMEN"; multiplier: number }
    | { type: "SENIOR"; multiplier: number }
    | { type: "CHILDREN"; multiplier: number }
    | { type: "NONE" };
};

export function calcFare(input: FareInput): number {
  const raw =
    input.baseFare +
    input.perKm * input.distanceKm +
    input.perMin * input.durationMin;
  const surged = raw * input.surgeMultiplier;
  const concession =
    input.concession && input.concession.type !== "NONE"
      ? input.concession.multiplier
      : 1;
  const final = Math.max(input.minimumFare, surged * concession);
  return Math.round(final);
}

// Haversine distance (km) between two lat/lng pairs.
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
