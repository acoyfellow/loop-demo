/**
 * Gate: loop-script
 * Verifies the loop script is executable and correctly structured
 */
import { existsSync, readFileSync, statSync } from "node:fs";

const SCRIPT = "scripts/loop.sh";

export async function run() {
  // Must exist
  if (!existsSync(SCRIPT)) {
    return { status: "failed" as const, error: new Error(`Missing ${SCRIPT}`) };
  }

  // Must be executable
  const stats = statSync(SCRIPT);
  const isExecutable = (stats.mode & 0o111) !== 0;
  if (!isExecutable) {
    return { status: "failed" as const, error: new Error(`${SCRIPT} is not executable`) };
  }
  console.log(`✓ ${SCRIPT} is executable`);

  // Check content structure
  const content = readFileSync(SCRIPT, "utf8");

  const required = [
    { pattern: /^#!.*bash/m, desc: "bash shebang" },
    { pattern: /deja\.coey\.dev/m, desc: "deja memory injection" },
    { pattern: /\.gateproof\/PAUSED/m, desc: "PAUSED check" },
    { pattern: /bun run.*prd/m, desc: "PRD execution" },
  ];

  for (const { pattern, desc } of required) {
    if (!pattern.test(content)) {
      return { status: "failed" as const, error: new Error(`Missing: ${desc}`) };
    }
    console.log(`✓ Has ${desc}`);
  }

  // Check package.json has loop script pointing to it
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (!pkg.scripts?.loop?.includes(SCRIPT)) {
    return { status: "failed" as const, error: new Error(`package.json scripts.loop must run ${SCRIPT}`) };
  }
  console.log(`✓ package.json wired correctly`);

  console.log("\n✓ Loop script valid");
  return { status: "success" as const };
}

if (import.meta.main) {
  run().catch(e => { console.error(e.message); process.exit(1); });
}
