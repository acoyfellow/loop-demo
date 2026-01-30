#!/usr/bin/env bun
/**
 * heal.ts - Call agent to fix PRD failures
 * 
 * Reads prd.ts and failure output, calls OpenCode Zen, writes fixes.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const API_KEY = process.env.OPENCODE_ZEN_API_KEY || 
                process.env.ANTHROPIC_API_KEY || 
                process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("No API key found");
  process.exit(1);
}

// Read PRD and failure
const prd = readFileSync("prd.ts", "utf8");
const failure = existsSync(".gateproof/output.txt") 
  ? readFileSync(".gateproof/output.txt", "utf8").slice(-2000)
  : "No output file";

console.log("Calling agent to fix...");

const response = await fetch("https://opencode.ai/zen/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "big-pickle",
    messages: [{
      role: "user",
      content: `Fix this gateproof PRD failure. Create or modify files to make gates pass.

PRD (prd.ts):
${prd}

Failure output:
${failure}

Output ONLY the file contents in this exact format (can have multiple files):
---FILE: path/to/file.ts---
file contents here
---END---`
    }],
    max_tokens: 2000,
  }),
});

if (!response.ok) {
  console.error("API error:", response.status, await response.text());
  process.exit(1);
}

const data = await response.json() as any;
const content = data.choices?.[0]?.message?.content;

if (!content) {
  console.error("No content in response");
  process.exit(1);
}

console.log("Agent response:", content.slice(0, 200));

// Parse and write files
const fileRegex = /---FILE:\s*([^\n]+)---\n([\s\S]*?)---END---/g;
let match;
let filesWritten = 0;

while ((match = fileRegex.exec(content)) !== null) {
  const filePath = match[1].trim();
  const fileContent = match[2];
  
  const dir = dirname(filePath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  
  writeFileSync(filePath, fileContent);
  console.log(`Wrote: ${filePath}`);
  filesWritten++;
}

if (filesWritten === 0) {
  console.log("No files parsed from response. Raw:");
  console.log(content);
}

console.log(`Done. Wrote ${filesWritten} files.`);
