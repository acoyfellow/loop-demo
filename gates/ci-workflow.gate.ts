/**
 * Gate: ci-workflow
 * Verifies GitHub Actions workflow is correctly configured
 */
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const WORKFLOW = ".github/workflows/loop.yml";

export async function run() {
  let workflow: any;
  try {
    const content = readFileSync(WORKFLOW, "utf8");
    workflow = parse(content);
  } catch (e) {
    return { status: "failed" as const, error: new Error(`Failed to parse ${WORKFLOW}: ${e}`) };
  }

  const triggers = workflow.on;
  if (!triggers?.push?.branches?.includes("main")) {
    return { status: "failed" as const, error: new Error("Workflow must trigger on push to main") };
  }
  console.log("✓ Triggers on push to main");

  if (!triggers?.workflow_dispatch) {
    return { status: "failed" as const, error: new Error("Workflow must have workflow_dispatch") };
  }
  console.log("✓ Has workflow_dispatch");

  const jobs = workflow.jobs;
  if (!jobs || Object.keys(jobs).length === 0) {
    return { status: "failed" as const, error: new Error("Workflow must have at least one job") };
  }
  console.log(`✓ Has jobs: ${Object.keys(jobs).join(", ")}`);

  const workflowStr = JSON.stringify(workflow);
  if (!/secrets\.(OPENCODE_ZEN_API_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY)/.test(workflowStr)) {
    return { status: "failed" as const, error: new Error("Workflow must reference API key secret") };
  }
  console.log("✓ References API key secrets");

  if (!workflowStr.includes("github-actions[bot]") && !workflowStr.includes("gateproof-bot")) {
    return { status: "failed" as const, error: new Error("Workflow should skip bot commits") };
  }
  console.log("✓ Skips bot commits");

  console.log("\n✓ CI workflow valid");
  return { status: "success" as const };
}

if (import.meta.main) {
  run().then(r => { if (r.status !== "success") { console.error(r.error?.message); process.exit(1); } });
}
