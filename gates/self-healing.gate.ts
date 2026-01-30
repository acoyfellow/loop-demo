/**
 * Gate: self-healing
 * Verifies all components are in place for self-healing to work.
 */
import { existsSync, readFileSync } from "node:fs";

export async function run() {
  console.log("Checking prd.ts...");
  if (!existsSync("prd.ts")) {
    return { status: "failed" as const, error: new Error("Missing prd.ts") };
  }

  const prdContent = readFileSync("prd.ts", "utf8");
  if (!prdContent.includes("stories:") || !prdContent.includes("gateFile:")) {
    return { status: "failed" as const, error: new Error("prd.ts must define stories with gateFile references") };
  }
  console.log("✓ prd.ts defines stories");

  console.log("\nChecking gate files...");
  const gateMatches = prdContent.matchAll(/gateFile:\s*["']([^"']+)["']/g);
  const gateFiles = [...gateMatches].map(m => m[1].replace(/^\.\//,""));

  if (gateFiles.length === 0) {
    return { status: "failed" as const, error: new Error("No gate files found in prd.ts") };
  }

  for (const gate of gateFiles) {
    if (!existsSync(gate)) {
      return { status: "failed" as const, error: new Error(`Missing gate: ${gate}`) };
    }
    console.log(`✓ ${gate}`);
  }

  console.log("\nChecking gateproof dependency...");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (!pkg.dependencies?.gateproof && !pkg.devDependencies?.gateproof) {
    return { status: "failed" as const, error: new Error("gateproof not in dependencies") };
  }
  console.log("✓ gateproof in dependencies");

  console.log("\nChecking healing infrastructure...");
  for (const file of ["scripts/loop.sh", ".github/workflows/loop.yml"]) {
    if (!existsSync(file)) {
      return { status: "failed" as const, error: new Error(`Missing: ${file}`) };
    }
    console.log(`✓ ${file}`);
  }

  console.log("\n✓ Self-healing infrastructure complete");
  return { status: "success" as const };
}

if (import.meta.main) {
  run().then(r => { if (r.status !== "success") { console.error(r.error?.message); process.exit(1); } });
}
