/** Display conversions only; the engine and saved driving amounts always use km and L/100 km. */
export type DrivingUnits = "metric" | "us";

// Exact international mile and US liquid gallon definitions (231 cubic inches, inch = 0.0254 m):
// https://www.nist.gov/pml/us-surveyfoot/revised-unit-conversion-factors
// https://www.nist.gov/system/files/documents/2023/01/30/appc-23-HB44.pdf (Appendix C, liquid volume)
const KM_PER_MILE = 1.609344;
const LITRES_PER_US_GALLON = 231 * 0.0254 ** 3 * 1000;
const MPG_FACTOR = (100 * LITRES_PER_US_GALLON) / KM_PER_MILE;

export const displayDistance = (km: number, units: DrivingUnits) => (units === "us" ? km / KM_PER_MILE : km);
export const metricDistance = (distance: number, units: DrivingUnits) =>
  units === "us" ? distance * KM_PER_MILE : distance;

/** Zero consumption is infinite mpg, not zero mpg. */
export const displayEfficiency = (lPer100km: number, units: DrivingUnits) =>
  units === "us" ? (lPer100km === 0 ? Infinity : MPG_FACTOR / lPer100km) : lPer100km;

/** Zero is also accepted as the app's explicit no-gasoline input, then displayed as infinity in mpg. */
export function metricEfficiency(value: number, units: DrivingUnits): number {
  if (value === 0 || value === Infinity) return 0;
  return units === "us" ? MPG_FACTOR / value : value;
}

export function distanceText(value: number): string {
  return value.toLocaleString("en-CA", { maximumFractionDigits: 3 });
}

export function efficiencyText(value: number): string {
  return value === Infinity
    ? "∞"
    : value.toLocaleString("en-CA", { useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 6 });
}
