# Output Patterns

Patterns for producing consistent, structured output in GitHub Copilot agent skills.
Read this during Phase 3 — Craft — when deciding how to specify output format or examples in the skill you are writing.

---

## Template Pattern

Use when the skill must produce output in a predictable shape — config files, policy XML, IaC templates, structured reports, etc.

Distinguish between strict (must match exactly) and flexible (sensible default, adapt as needed):

**Strict — use ALWAYS language:**

```markdown
## Output format

ALWAYS use this exact structure. Do not deviate.

[Insert literal template here, with placeholder tokens like {resource_name}]

If the user's request cannot fit the template, ask for clarification rather than improvising a different format.
```

**Flexible — use "sensible default" language:**

```markdown
## Output format

Default structure below; adapt sections based on what the request requires:

[Insert default structure here]

Add or remove sections as the specific context warrants. The goal is a useful document, not strict adherence to the template.
```

**When to use which:** Strict belongs in skills that produce machine-consumed output (IaC files, API policies, CI/CD pipeline YAML). Flexible belongs in skills that produce human-read output (architecture designs, reports, meeting summaries).

---

## Examples Pattern

Use when the skill's output quality depends on matching a style or level of detail that is hard to describe in prose alone. Showing is almost always clearer than describing.

Provide 2–3 input/output pairs that represent the range of requests the skill will receive:

```markdown
## Examples

### Example 1: [Representative request type]
User says: "[realistic user message]"

Output:
[concrete, realistic output — not a placeholder like "result goes here"]

### Example 2: [Different request type or edge case]
User says: "[slightly different request]"

Output:
[concrete output]

### What NOT to produce
User says: "[request that is out of scope or often confused with this skill]"
→ Do not [specific wrong output]. Instead, [correct response].
```

The "what NOT to produce" example is especially useful when the skill sits near other skills with similar trigger phrases.

---

## Scope Communication Pattern

Use when the skill needs to handle out-of-scope requests gracefully rather than silently producing wrong output. Include an explicit boundary statement near the top of the skill:

```markdown
## Scope

This skill handles: [specific list of what it covers]

If the request falls outside this scope, state clearly what you can and cannot do:
- "This is a [X] question, not a [Y] question — [suggest appropriate approach or skill]."
- "Generating [format] is outside this skill. The [other-skill] skill handles that."

Never silently produce output for a request type the skill was not designed for.
```

This prevents the skill from confidently generating incorrect output when it encounters an edge case it wasn't designed for.

---

## Validation Gate Pattern

Use for skills with workflows that should check prerequisites before starting work—particularly any skill that creates or modifies files, calls external services, or produces output that is hard to undo.

```markdown
## Before starting

Verify the following before writing any output:

1. [Prerequisite 1] — if missing or unclear: ask "[specific question]" before proceeding
2. [Prerequisite 2] — if missing: state "[what is needed and why]"
3. [Prerequisite 3] — if ambiguous: offer a sensible default and confirm

Only proceed once all prerequisites are confirmed or the user has acknowledged the default.
```

The questions should be targeted — don't dump a discovery interview on the user. One or two focused questions with suggested defaults get answers faster than an open-ended list.
