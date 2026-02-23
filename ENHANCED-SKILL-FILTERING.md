# Enhanced Per-Agent Skill Filtering

## Overview

This enhancement extends OpenClaw's existing per-agent skill filtering to support both allowlist and denylist patterns, similar to the `tools.deny` configuration.

## Current vs Enhanced API

### Before (Existing)
```json5
{
  "agents": {
    "list": [
      {
        "id": "ops",
        "skills": ["discord"]  // Simple allowlist
      }
    ]
  }
}
```

### After (Enhanced)  
```json5
{
  "agents": {
    "list": [
      {
        "id": "ops",
        "skills": {
          "allow": ["discord"],                    // Explicit allowlist
          "deny": ["coding-agent", "database"],    // Explicit denylist  
          "alsoAllow": ["weather"]                 // Additional allows
        }
      }
    ]
  }
}
```

### Backward Compatibility

The legacy `skills: [...]` format remains fully supported:

```json5
{
  "agents": {
    "list": [
      {
        "id": "legacy-agent", 
        "skills": ["github", "weather"]  // ✅ Still works
      },
      {
        "id": "enhanced-agent",
        "skills": {                       // ✅ New format
          "allow": ["discord"],
          "deny": ["coding-agent"]
        }
      }
    ]
  }
}
```

## Filtering Logic

1. **Base filtering**: Environment, binary requirements, config checks (unchanged)
2. **Agent deny filter**: Remove skills matching `skills.deny` entries
3. **Agent allow filter**: If `skills.allow` or legacy `skills: [...]` is specified, only include matching skills

## Configuration Options

### `skills.allow: string[]`
Only include skills with names in this list.

### `skills.deny: string[]`  
Exclude skills with names in this list (applied before allow filtering).

### `skills.alsoAllow: string[]`
Additional skills to include (merged with `allow` list).

## Examples

### Example 1: Operations Agent (Minimal Skills)
```json5
{
  "id": "ops",
  "skills": {
    "allow": ["discord"]  // Only discord skill
  }
}
```

### Example 2: Coding Agent (Exclude Security)
```json5  
{
  "id": "coding",
  "skills": {
    "deny": ["security-audit", "database"]  // All except these
  }
}
```

### Example 3: Mixed Approach
```json5
{
  "id": "mixed",
  "skills": {
    "allow": ["github", "discord"],
    "alsoAllow": ["weather"],           // Effective: ["github", "discord", "weather"]
    "deny": ["coding-agent"]            // Remove coding-agent if it was included
  }
}
```

## Migration Guide

### No Migration Required
Existing configurations using `skills: [...]` continue to work without changes.

### Optional Migration
To take advantage of deny filtering, convert:

```json5
// Before
{
  "id": "ops", 
  "skills": ["discord"]
}

// After (equivalent)
{
  "id": "ops",
  "skills": {
    "allow": ["discord"] 
  }
}

// After (with deny filtering)
{
  "id": "ops",
  "skills": {
    "allow": ["discord"],
    "deny": ["coding-agent", "security-audit", "database"]
  }
}
```

## Use Cases

### 1. Specialized Agents
**Problem**: The `ops` agent lists 10+ irrelevant skills when asked what it can do.
**Solution**: Use allowlist to show only relevant skills.

```json5
{
  "id": "ops",
  "skills": {"allow": ["discord"]}
}
```

### 2. Security Restrictions  
**Problem**: The `public-bot` agent shouldn't have access to sensitive skills.
**Solution**: Use denylist to block dangerous skills.

```json5
{
  "id": "public-bot", 
  "skills": {"deny": ["database", "security-audit", "admin-tools"]}
}
```

### 3. Role-Based Access
**Problem**: Different agent types need different skill sets.
**Solution**: Mix allow/deny for precise control.

```json5
{
  "agents": {
    "list": [
      {
        "id": "dev-agent",
        "skills": {"allow": ["github", "coding-agent", "database"]}
      },
      {
        "id": "ops-agent", 
        "skills": {"allow": ["discord", "monitoring", "deploy"]}
      },
      {
        "id": "support-agent",
        "skills": {"deny": ["database", "deploy", "security-audit"]}
      }
    ]
  }
}
```

## Implementation Details

### Type Definitions
```typescript
export type AgentSkillsConfig = {
  allow?: string[];
  alsoAllow?: string[];
  deny?: string[];
};

export type AgentConfig = {
  // ... other fields
  skills?: string[] | AgentSkillsConfig;  // Union type for backward compatibility
};
```

### Resolution Functions
- `resolveAgentSkillsFilter(config, agentId)` - Returns allow list (legacy + new format)
- `resolveAgentSkillsDenyFilter(config, agentId)` - Returns deny list (new format only)

### Filtering Flow
1. Load all available skills
2. Apply environment/binary/config gates
3. **NEW**: Apply agent deny filter (`skills.deny`)
4. Apply agent allow filter (`skills.allow` or legacy `skills: [...]`)
5. Apply other filters (bundled allowlist, etc.)

## Testing

The implementation includes comprehensive tests for:
- ✅ Legacy format compatibility
- ✅ New enhanced format 
- ✅ Mixed configurations
- ✅ Edge cases and validation

Run tests:
```bash
cd ~/oss/repos/openclaw
node test-enhanced-skill-filtering.ts
```

## Benefits

1. **Backward Compatible**: Existing configurations work unchanged
2. **Consistent API**: Mirrors existing `tools.deny` pattern  
3. **Flexible**: Supports both allowlist and denylist approaches
4. **Precise Control**: Fine-grained skill filtering per agent
5. **Maintainable**: Reduces agent prompt size and improves clarity

## Files Changed

- `src/config/types.agents.ts` - Added `AgentSkillsConfig` type
- `src/agents/agent-scope.ts` - Added `resolveAgentSkillsDenyFilter()`  
- `src/agents/skills/workspace.ts` - Enhanced `filterSkillEntries()` with deny filtering
- `src/commands/agent.ts` - Pass `agentId` to skill filtering

## Future Enhancements

- **Glob patterns**: Support `"coding-*"` style patterns
- **Skill groups**: Define reusable skill groups like tool profiles
- **Inheritance**: Agent skill inheritance from defaults
- **Validation**: Better error messages for invalid skill names