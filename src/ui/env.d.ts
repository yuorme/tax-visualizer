// The build injects every validated year of data/years/ as this module (see scripts/build.ts).
declare module "virtual:years" {
  import type { YearData } from "../data/schema.ts";

  const years: Record<number, YearData>;
  export default years;
}
