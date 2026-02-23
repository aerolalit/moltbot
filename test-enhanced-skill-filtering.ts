#!/usr/bin/env node

/**
 * Test script to demonstrate enhanced per-agent skill filtering
 * 
 * This tests both the original format and the new enhanced format:
 * 
 * Original: skills: ["skill1", "skill2"]  (allowlist only)
 * Enhanced: skills: {allow: ["skill1"], deny: ["skill2"], alsoAllow: ["skill3"]}
 */

import { resolveAgentSkillsFilter, resolveAgentSkillsDenyFilter } from './src/agents/agent-scope.js';
import type { OpenClawConfig } from './src/config/config.js';

// Test data
const configWithLegacyFormat: OpenClawConfig = {
  agents: {
    list: [
      {
        id: "legacy-agent",
        skills: ["github", "weather"] // Legacy array format
      }
    ]
  }
};

const configWithEnhancedFormat: OpenClawConfig = {
  agents: {
    list: [
      {
        id: "enhanced-agent", 
        skills: {
          allow: ["github"],
          deny: ["coding-agent", "security-audit"],
          alsoAllow: ["weather"]
        }
      }
    ]
  }
};

const configWithMixedFormats: OpenClawConfig = {
  agents: {
    list: [
      {
        id: "legacy-agent",
        skills: ["github", "weather"] // Legacy
      },
      {
        id: "enhanced-agent",
        skills: {
          allow: ["discord"],
          deny: ["coding-agent", "ai-pdf-builder", "database"],
          alsoAllow: ["weather"]
        }
      }
    ]
  }
};

// Test functions
function testLegacyFormat() {
  console.log("\n=== Testing Legacy Format ===");
  
  const allowFilter = resolveAgentSkillsFilter(configWithLegacyFormat, "legacy-agent");
  const denyFilter = resolveAgentSkillsDenyFilter(configWithLegacyFormat, "legacy-agent");
  
  console.log("Allow filter:", allowFilter); // Should be ["github", "weather"]
  console.log("Deny filter:", denyFilter);   // Should be undefined
  
  return allowFilter?.sort()?.join(",") === "github,weather" && denyFilter === undefined;
}

function testEnhancedFormat() {
  console.log("\n=== Testing Enhanced Format ===");
  
  const allowFilter = resolveAgentSkillsFilter(configWithEnhancedFormat, "enhanced-agent");
  const denyFilter = resolveAgentSkillsDenyFilter(configWithEnhancedFormat, "enhanced-agent");
  
  console.log("Allow filter:", allowFilter); // Should be ["github", "weather"] 
  console.log("Deny filter:", denyFilter);   // Should be ["coding-agent", "security-audit"]
  
  const expectedAllow = ["github", "weather"].sort().join(",");
  const expectedDeny = ["coding-agent", "security-audit"].sort().join(",");
  
  return allowFilter?.sort()?.join(",") === expectedAllow && 
         denyFilter?.sort()?.join(",") === expectedDeny;
}

function testMixedFormats() {
  console.log("\n=== Testing Mixed Formats ===");
  
  // Test legacy agent in mixed config
  const legacyAllow = resolveAgentSkillsFilter(configWithMixedFormats, "legacy-agent");
  const legacyDeny = resolveAgentSkillsDenyFilter(configWithMixedFormats, "legacy-agent");
  
  // Test enhanced agent in mixed config  
  const enhancedAllow = resolveAgentSkillsFilter(configWithMixedFormats, "enhanced-agent");
  const enhancedDeny = resolveAgentSkillsDenyFilter(configWithMixedFormats, "enhanced-agent");
  
  console.log("Legacy allow:", legacyAllow);
  console.log("Legacy deny:", legacyDeny);
  console.log("Enhanced allow:", enhancedAllow);
  console.log("Enhanced deny:", enhancedDeny);
  
  return legacyAllow?.sort()?.join(",") === "github,weather" &&
         legacyDeny === undefined &&
         enhancedAllow?.sort()?.join(",") === "discord,weather" &&
         enhancedDeny?.sort()?.join(",") === "ai-pdf-builder,coding-agent,database";
}

// Run tests
console.log("🧪 Testing Enhanced Per-Agent Skill Filtering");

const results = [
  testLegacyFormat(),
  testEnhancedFormat(), 
  testMixedFormats()
];

const allPassed = results.every(Boolean);

console.log(allPassed ? "\n✅ All tests passed!" : "\n❌ Some tests failed!");
console.log(`Results: ${results.map(r => r ? "PASS" : "FAIL").join(", ")}`);

process.exit(allPassed ? 0 : 1);