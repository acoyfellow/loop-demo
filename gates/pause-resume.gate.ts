/**
 * Gate: pause-resume
 * Functionally tests that PAUSED file stops the loop
 */
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";

const PAUSED = ".gateproof/PAUSED";
const SCRIPT = "scripts/loop.sh";

export async function run() {
  if (!existsSync(".gateproof")) {
    mkdirSync(".gateproof", { recursive: true });
  }

  // Test 1: With PAUSED file, loop should exit immediately
  console.log("Test 1: Loop exits when PAUSED...");
  writeFileSync(PAUSED, "testing");

  try {
    const result = Bun.spawnSync(["bash", SCRIPT], {
      timeout: 5000,
      env: { ...process.env, OPENCODE_ZEN_API_KEY: "dummy" },
    });
    
    const output = result.stdout.toString() + result.stderr.toString();
    
    if (!output.includes("PAUSED")) {
      return { status: "failed" as const, error: new Error("Loop did not recognize PAUSED file") };
    }
    
    if (result.exitCode !== 0) {
      return { status: "failed" as const, error: new Error("Loop should exit 0 when paused") };
    }
    
    console.log("✓ Loop exits gracefully when PAUSED");
    
  } finally {
    if (existsSync(PAUSED)) unlinkSync(PAUSED);
  }

  // Test 2: Without PAUSED, loop should attempt to run
  console.log("\nTest 2: Loop attempts to run without PAUSED...");

  const result = Bun.spawnSync(["bash", SCRIPT], {
    timeout: 10000,
    env: { ...process.env, OPENCODE_ZEN_API_KEY: "dummy" },
  });

  const output = result.stdout.toString() + result.stderr.toString();

  if (output.includes("PAUSED") && output.includes("Delete")) {
    return { status: "failed" as const, error: new Error("Loop thinks it's paused when it shouldn't be") };
  }

  if (!(output.includes("deja") || output.includes("prd") || output.includes("iteration"))) {
    return { status: "failed" as const, error: new Error("Loop didn't attempt to run") };
  }
  console.log("✓ Loop attempts execution without PAUSED");

  console.log("\n✓ Pause/resume mechanism works");
  return { status: "success" as const };
}

if (import.meta.main) {
  run().then(r => { if (r.status !== "success") { console.error(r.error?.message); process.exit(1); } });
}
