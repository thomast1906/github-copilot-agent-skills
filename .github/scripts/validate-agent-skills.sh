#!/bin/bash
set -e

echo "=== Validating Agent Skills ==="
echo ""

FAILED=0
MAX_LINES=500
MIN_DESC_LENGTH=30

# Check file sizes
echo "📏 Checking SKILL.md file sizes (max $MAX_LINES lines)..."
for skill_file in .github/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    LINE_COUNT=$(wc -l < "$skill_file")
    SKILL_NAME=$(dirname "$skill_file" | xargs basename)
    
    printf "   %-30s %3d lines " "$SKILL_NAME:" "$LINE_COUNT"
    
    if [ "$LINE_COUNT" -gt "$MAX_LINES" ]; then
      echo "❌ EXCEEDS LIMIT"
      echo "      Consider moving content to references/ directory"
      FAILED=1
    else
      echo "✅"
    fi
  fi
done
echo ""

# Check frontmatter format
echo "📝 Checking frontmatter format..."
for skill_file in .github/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    SKILL_NAME=$(dirname "$skill_file" | xargs basename)
    printf "   %-30s " "$SKILL_NAME:"
    
    # Check file starts with ---
    FIRST_LINE=$(head -n 1 "$skill_file")
    if [ "$FIRST_LINE" != "---" ]; then
      echo "❌ Must start with '---'"
      FAILED=1
      continue
    fi
    
    # Check directory name matches name field
    NAME_FIELD=$(sed -n '2,10p' "$skill_file" | grep "^name:" | sed 's/^name: *//')
    if [ "$NAME_FIELD" != "$SKILL_NAME" ]; then
      echo "❌ Directory name mismatch"
      echo "      Directory: $SKILL_NAME"
      echo "      Name field: $NAME_FIELD"
      FAILED=1
      continue
    fi
    
    # Check required fields exist
    if ! grep -q "^name:" "$skill_file"; then
      echo "❌ Missing 'name' field"
      FAILED=1
      continue
    fi
    
    if ! grep -q "^description:" "$skill_file"; then
      echo "❌ Missing 'description' field"
      FAILED=1
      continue
    fi
    
    echo "✅"
  fi
done
echo ""

# Check for code blocks wrapping frontmatter
echo "🔍 Checking for code block issues..."
CODE_BLOCK_FAILED=0
for skill_file in .github/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    SKILL_NAME=$(dirname "$skill_file" | xargs basename)
    
    if head -n 1 "$skill_file" | grep -q '```'; then
      printf "   %-30s ❌ Frontmatter wrapped in code block\n" "$SKILL_NAME:"
      FAILED=1
      CODE_BLOCK_FAILED=1
    fi
  fi
done

if [ "$CODE_BLOCK_FAILED" -eq 0 ]; then
  echo "   ✅ No code block issues found"
fi
echo ""

# Check description length
echo "📋 Checking description length (min $MIN_DESC_LENGTH chars)..."
for skill_file in .github/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    SKILL_NAME=$(dirname "$skill_file" | xargs basename)
    DESC=$(sed -n '2,10p' "$skill_file" | grep "^description:" | sed 's/^description: *//')
    DESC_LEN=${#DESC}
    printf "   %-30s %3d chars " "$SKILL_NAME:" "$DESC_LEN"
    if [ "$DESC_LEN" -lt "$MIN_DESC_LENGTH" ]; then
      echo "❌ Too short (Copilot may not invoke reliably)"
      FAILED=1
    else
      echo "✅"
    fi
  fi
done
echo ""

# Check "When to Use" section exists in skills
echo "🎯 Checking for '## When to Use' section..."
for skill_file in .github/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    SKILL_NAME=$(dirname "$skill_file" | xargs basename)
    printf "   %-30s " "$SKILL_NAME:"
    if grep -q "^## When to Use" "$skill_file"; then
      echo "✅"
    else
      echo "❌ Missing '## When to Use' section (required for reliable invocation)"
      FAILED=1
    fi
  fi
done
echo ""

# Check for duplicate skill names
echo "🔁 Checking for duplicate skill names..."
NAMES=$(for f in .github/skills/*/SKILL.md; do sed -n '2,10p' "$f" | grep "^name:" | sed 's/^name: *//'; done)
DUPES=$(echo "$NAMES" | sort | uniq -d)
if [ -n "$DUPES" ]; then
  echo "   ❌ Duplicate skill names found: $DUPES"
  FAILED=1
else
  echo "   ✅ No duplicates"
fi
echo ""

# Check broken internal file references in skills
echo "🔗 Checking internal file references in skills..."
SKILL_REF_FAILED=0
for skill_file in .github/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    SKILL_NAME=$(dirname "$skill_file" | xargs basename)
    # Extract relative markdown links like (references/FOO.md) or (./references/FOO.md)
    while IFS= read -r ref; do
      ref_path="$(dirname "$skill_file")/$ref"
      if [ ! -f "$ref_path" ]; then
        echo "   ❌ $SKILL_NAME: broken reference → $ref"
        FAILED=1
        SKILL_REF_FAILED=1
      fi
    done < <(grep -oE '\(\.?/?references/[^)]+\)' "$skill_file" | tr -d '()')
  fi
done
if [ "$SKILL_REF_FAILED" -eq 0 ]; then
  echo "   ✅ All internal skill references valid"
fi
echo ""

# Validate agent files
echo "🤖 Validating agent files (.agent.md)..."
AGENT_FAILED=0
AGENT_NAMES=""
for agent_file in .github/agents/*.agent.md; do
  if [ -f "$agent_file" ]; then
    AGENT_NAME=$(basename "$agent_file")
    printf "   %-45s " "$AGENT_NAME:"

    # Check starts with ---
    FIRST_LINE=$(head -n 1 "$agent_file")
    if [ "$FIRST_LINE" != "---" ]; then
      echo "❌ Must start with '---'"
      FAILED=1; AGENT_FAILED=1; continue
    fi

    # Check required fields
    if ! grep -q "^name:" "$agent_file"; then
      echo "❌ Missing 'name' field"
      FAILED=1; AGENT_FAILED=1; continue
    fi
    if ! grep -q "^description:" "$agent_file"; then
      echo "❌ Missing 'description' field"
      FAILED=1; AGENT_FAILED=1; continue
    fi

    # Check description length
    DESC=$(sed -n '2,10p' "$agent_file" | grep "^description:" | sed 's/^description: *//')
    DESC_LEN=${#DESC}
    if [ "$DESC_LEN" -lt "$MIN_DESC_LENGTH" ]; then
      echo "❌ Description too short ($DESC_LEN chars)"
      FAILED=1; AGENT_FAILED=1; continue
    fi

    # Collect names for duplicate check
    NAME_VAL=$(sed -n '2,10p' "$agent_file" | grep "^name:" | sed 's/^name: *//')
    AGENT_NAMES="$AGENT_NAMES\n$NAME_VAL"

    echo "✅"
  fi
done

# Check for duplicate agent names
DUPES=$(printf "$AGENT_NAMES" | sort | uniq -d)
if [ -n "$DUPES" ]; then
  echo "   ❌ Duplicate agent names found: $DUPES"
  FAILED=1
fi

if [ "$AGENT_FAILED" -eq 0 ]; then
  echo ""
fi

# Check broken skill path references inside agents
echo "🔗 Checking skill path references in agents..."
AGENT_REF_FAILED=0
for agent_file in .github/agents/*.agent.md; do
  if [ -f "$agent_file" ]; then
    AGENT_NAME=$(basename "$agent_file")
    while IFS= read -r ref; do
      if [ ! -f "$ref" ]; then
        echo "   ❌ $AGENT_NAME: broken reference → $ref"
        FAILED=1
        AGENT_REF_FAILED=1
      fi
    done < <(grep -oE '`\.github/skills/[^`]+`' "$agent_file" | tr -d '`')
  fi
done
if [ "$AGENT_REF_FAILED" -eq 0 ]; then
  echo "   ✅ All agent skill references valid"
fi
echo ""

# Summary
if [ "$FAILED" -eq 1 ]; then
  echo "❌ Validation failed!"
  exit 1
fi