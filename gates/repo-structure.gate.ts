/**
 * Gate: repo-structure
 * Verifies required files exist with valid content
 */
import { existsSync, readFileSync } from "node:fs";

export async function run() {
  const checks: Array<{ file: string; validate: (content: string) => boolean; error: string }> = [
    {
      file: "package.json",
      validate: (c) => {
        try {
          const pkg = JSON.parse(c);
          return pkg.name && pkg.scripts;
        } catch { return false; }
      },
      error: "package.json must be valid JSON with name and scripts"
    },
    {
      file: "README.md",
      validate: (c) => c.length > 50 && c.includes("loop"),
      error: "README.md must exist with meaningful content about the loop"
    },
    {
      file: ".github/workflows/loop.yml",
      validate: (c) => c.includes("on:") && c.includes("push:"),
      error: "loop.yml must be valid workflow with push trigger"
    }
  ];

  let failed = false;

  for (const check of checks) {
    if (!existsSync(check.file)) {
      console.error(`✗ Missing: ${check.file}`);
      failed = true;
      continue;
    }
    
    const content = readFileSync(check.file, "utf8");
    if (!check.validate(content)) {
      console.error(`✗ Invalid: ${check.error}`);
      failed = true;
      continue;
    }
    
    console.log(`✓ ${check.file}`);
  }

  if (failed) {
    return { status: "failed" as const, error: new Error("Required files check failed") };
  }
  console.log("\n✓ All required files valid");
  return { status: "success" as const };
}

if (import.meta.main) {
  run().catch(e => { console.error(e.message); process.exit(1); });
}
