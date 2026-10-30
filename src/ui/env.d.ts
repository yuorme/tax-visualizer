// The build injects every validated year of data/years/ as this module (see scripts/build.ts).
// An ambient module can't use a relative import declaration (and skipLibCheck would hide the error, leaving the data
// typed as any), so the type is referenced with an import() type instead.
declare module "virtual:years" {
  const years: Record<number, import("../data/schema.ts").YearData>;
  export default years;
}
