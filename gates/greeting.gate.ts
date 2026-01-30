/**
 * Gate: greeting-module
 * Tests that src/greeting.ts exists and exports a working greet function
 */
import { existsSync } from "node:fs";

export async function run() {
  const modulePath = "./src/greeting.ts";
  
  // File must exist
  if (!existsSync("src/greeting.ts")) {
    return { 
      status: "failed" as const, 
      error: new Error("src/greeting.ts does not exist. Create it with: export function greet(name: string): string { return `Hello, ${name}!`; }") 
    };
  }
  console.log("✓ src/greeting.ts exists");
  
  // Import and test the function
  try {
    const mod = await import(modulePath);
    
    if (typeof mod.greet !== "function") {
      return { 
        status: "failed" as const, 
        error: new Error("src/greeting.ts must export a 'greet' function") 
      };
    }
    console.log("✓ greet function exported");
    
    // Test the function
    const result = mod.greet("World");
    if (result !== "Hello, World!") {
      return { 
        status: "failed" as const, 
        error: new Error(`greet("World") returned "${result}" but expected "Hello, World!"`) 
      };
    }
    console.log("✓ greet('World') returns 'Hello, World!'");
    
    // Test with another name
    const result2 = mod.greet("Agent");
    if (result2 !== "Hello, Agent!") {
      return { 
        status: "failed" as const, 
        error: new Error(`greet("Agent") returned "${result2}" but expected "Hello, Agent!"`) 
      };
    }
    console.log("✓ greet('Agent') returns 'Hello, Agent!'");
    
  } catch (e: any) {
    return { 
      status: "failed" as const, 
      error: new Error(`Failed to import src/greeting.ts: ${e.message}`) 
    };
  }
  
  console.log("\n✓ Greeting module works correctly");
  return { status: "success" as const };
}

if (import.meta.main) {
  run().then(r => { 
    if (r.status !== "success") { 
      console.error(r.error?.message); 
      process.exit(1); 
    } 
  });
}
