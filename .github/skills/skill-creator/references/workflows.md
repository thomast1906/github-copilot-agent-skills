# Workflow Patterns

Use during Phase 2 — Architecture — when deciding how to structure a skill's instructions.

Five patterns cover most real skills. Most complex skills combine a primary and one or two secondary patterns.

---

## 1. Sequential Workflow

**Choose when:** The task has a natural linear order where each step produces input for the next. Skipping or reordering steps would break the outcome.

**Signals:** User says "do X, then Y"; steps share data; there is a clear start and end state.

**Structure:**

Include an overview near the top of SKILL.md so the agent knows the full shape of the work before starting step 1:

```markdown
This workflow involves four steps:
1. [Step name] — [one-line description]
2. [Step name] — [one-line description]
3. [Step name] — [one-line description]
4. [Step name] — [one-line description]
```

Then give each step its own section:

```markdown
### Step 1 — [Name]
[What to do]
Validation: [how to know this step succeeded before moving on]
On failure: [what to do rather than silently continuing]
```

**Watch out for:** Missing on-failure handling (what if step 3 fails after steps 1–2 completed?); rigid ordering when some steps could safely run in parallel.

---

## 2. Conditional / Branching Workflow

**Choose when:** The right path depends on a property of the input — file type, tool available, environment, or the user's answer to a question.

**Signals:** "Handle X differently from Y"; "if the user has Z available, do A, otherwise do B".

**Structure:**

```markdown
### Identify the input type
- [Type A]: follow the [Name A] path below
- [Type B]: follow the [Name B] path below
- [Neither]: state clearly that this falls outside the skill's scope and suggest an alternative

### [Name A] path
[Steps]

### [Name B] path
[Steps]
```

Be explicit about what triggers each branch. State the fallback — never leave the agent to guess what to do with an unexpected input.

**Watch out for:** Overlapping branch conditions (two branches could match the same input); missing catchall for unexpected cases.

---

## 3. Iterative Refinement

**Choose when:** Output quality improves through review-and-fix cycles. First drafts are usually close but not right; explicit criteria exist to check against.

**Signals:** The skill produces documents, designs, or generated content that needs review; quality is multi-dimensional; users historically ask for revisions after first output.

**Structure:**

```markdown
### Draft
Generate initial output based on gathered requirements.

### Review
Check against these criteria:
- [Criterion 1]: [how to verify — must be checkable, not vague]
- [Criterion 2]: [how to verify]

### Refine
For each issue found: identify the specific problem → fix it → re-check that criterion.

### Stop when
- All criteria pass, OR
- 3 iterations completed (returns diminish after this), OR
- User explicitly approves the output
```

The stopping condition is mandatory — without it the loop runs indefinitely or the agent decides arbitrarily when to stop.

**Watch out for:** Vague criteria ("make it better" is not a criterion — "description is under 1024 characters" is); no stopping condition.

---

## 4. Multi-Tool Coordination

**Choose when:** The workflow crosses tool or service boundaries. Data must flow from one tool into a second, possibly into a third. The overall result depends on all phases completing successfully.

**Signals:** "Get data from X, update Y, then notify Z"; involves multiple MCP servers or file system + API combinations; partial completion has consequences.

**Structure:**

```markdown
### Phase 1 — [Service / tool name]
1. [Action]
2. [Action]
Output: [exactly what this phase produces, named clearly]

### Phase 2 — [Service / tool name]
Input: [output from Phase 1]
1. [Action using Phase 1 data]
2. [Action]
Output: [what this phase produces]

### Phase 3 — [Service / tool name]
Input: [output from Phase 2]
[Steps]

### Error handling
- If Phase 1 fails: [action]
- If Phase 2 fails after Phase 1 succeeded: [action — Phase 1 may need to be rolled back or flagged]
```

Make data flow explicit. State exactly what output from Phase N becomes input to Phase N+1. Always handle partial failure — "Phase 2 succeeded but Phase 3 failed" is a real state that needs an instruction.

**Watch out for:** Assuming all tools/MCPs are available; tight coupling where any phase failure silently corrupts output; not cleaning up if a later phase fails.

---

## 5. Domain Intelligence

**Choose when:** The skill's value is specialised knowledge — compliance rules, security standards, quality criteria — not just procedure execution. The agent needs to *reason from rules*, not just follow steps.

**Signals:** "Apply our standards"; getting it wrong has consequences; rules must be enforced before action rather than checked after; users benefit from the skill's expertise more than its automation.

**Structure:**

```markdown
### Pre-checks
Before producing any output, verify:
1. [Rule 1]: [how to check] — if it fails: [stop and explain, don't continue]
2. [Rule 2]: [how to check] — if it fails: [specific guidance]

Only proceed if all pre-checks pass.

### [Main action]
[Steps, with the domain rules embedded as constraints]

### Reasoning
For each significant decision, state why: "[choice] because [rule or constraint it satisfies]."
This makes the output reviewable and the reasoning auditable.
```

**Watch out for:** Hardcoding rules that change frequently — reference an external doc instead; not explaining the reasoning behind enforcement (agents and users both respond better to *why* than to *MUST*).

---

## Choosing a Pattern

| Signal from the workflow | Primary pattern |
|---|---|
| Steps depend on each other in order | Sequential |
| Different inputs need different paths | Conditional |
| Output improves through review cycles | Iterative Refinement |
| Workflow crosses multiple tools or services | Multi-Tool Coordination |
| Expert rules must be applied before action | Domain Intelligence |
| Some steps are independent of each other | Sequential with parallel notes |
| "It depends" comes up frequently in discovery | Conditional |
| User asks for revisions after first output | Iterative Refinement |

## Combining Patterns

Most real skills use one primary pattern and one or two secondary patterns within specific steps:

- **Sequential + Domain Intelligence:** Follow steps in order, but embed expert pre-checks at the steps with consequences.
- **Conditional + Sequential:** Choose the right path first, then follow a sequential workflow along that path.
- **Multi-Tool + Iterative:** Coordinate across services, then refine the combined output.
- **Domain Intelligence + Iterative:** Apply rules to generate the first draft, then review against those same rules and refine.

Identify the **primary** pattern (shapes the overall flow) and note secondary patterns in Phase 2 Architecture before writing.
