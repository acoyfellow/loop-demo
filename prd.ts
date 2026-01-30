/**
 * loop-demo: A self-healing repo built with gateproof
 * 
 * This repo heals itself. Push triggers the loop.
 * The loop runs until all gates pass. PAUSED is your kill switch.
 * 
 * We're building the loop WITH the loop. Meta.
 */

import { definePrd, runPrd } from "gateproof/prd";

export const prd = definePrd({
  name: "loop-demo",
  description: "A self-healing repo that demonstrates gateproof + deja",
  
  stories: [
    {
      id: "repo-structure",
      title: "Repo has required files: package.json, README.md, .github/workflows/loop.yml",
      gateFile: "./gates/repo-structure.gate.ts"
    },
    {
      id: "loop-script",
      title: "bun run loop executes the healing loop with deja memory",
      gateFile: "./gates/loop-script.gate.ts",
      dependsOn: ["repo-structure"]
    },
    {
      id: "ci-workflow", 
      title: "Push to main triggers loop.yml workflow that heals until complete",
      gateFile: "./gates/ci-workflow.gate.ts",
      dependsOn: ["loop-script"]
    },
    {
      id: "pause-resume",
      title: ".gateproof/PAUSED file stops the loop, deleting it resumes",
      gateFile: "./gates/pause-resume.gate.ts",
      dependsOn: ["loop-script"]
    },
    {
      id: "self-healing",
      title: "Repo can heal itself: intentionally break something, loop fixes it",
      gateFile: "./gates/self-healing.gate.ts",
      dependsOn: ["ci-workflow", "pause-resume"]
    },
    {
      id: "greeting-module",
      title: "src/greeting.ts exports a greet(name) function that returns 'Hello, {name}!'",
      gateFile: "./gates/greeting.gate.ts",
      dependsOn: ["repo-structure"]
    }
  ]
});

// Run if executed directly
if (import.meta.main) {
  const args = process.argv.slice(2);
  const reportPath = args.includes("--report") 
    ? args[args.indexOf("--report") + 1] 
    : undefined;
    
  const result = await runPrd(prd, process.cwd(), { reportPath });
  
  if (result.report) {
    for (const story of result.report.stories) {
      const status = story.status === "success" ? "✓" : "✗";
      console.log(`${status} ${story.id}: ${story.title}`);
      if (story.error) {
        console.log(`  Error: ${story.error.message}`);
      }
    }
  }
  
  process.exit(result.success ? 0 : 1);
}
