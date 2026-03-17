---
name: skill-creator
description: Create, update, review, and validate GitHub Copilot agent skills (SKILL.md files). Use this skill whenever someone wants to create a new skill, build a skill from scratch, package domain knowledge into a reusable agent skill, turn a workflow into a skill, or asks "how do I teach Copilot to do X consistently". Also use when updating or improving an existing SKILL.md, writing the description field for better triggering, or designing the folder structure and bundled resources for a skill. Do NOT use for general coding questions, runtime debugging, or MCP server configuration.
---

# Skill Creator

Create high-quality GitHub Copilot agent skills (SKILL.md) that transform the general-purpose agent into a specialized expert.

## What Is a Skill

A skill is a modular, self-contained knowledge package stored in `.github/skills/<skill-name>/SKILL.md`. It provides:

- **Specialized workflows** — Multi-step procedures for a specific domain
- **Domain expertise** — Company-specific schemas, patterns, business logic
- **Tool integrations** — Instructions for APIs, file formats, or services
- **Bundled resources** — Scripts, reference docs, and templates for reuse

Skills load in three levels (progressive disclosure):

1. **Metadata** (`name` + `description`) — Always in context (~100 words). This is the trigger mechanism.
2. **SKILL.md body** — Loaded when the skill triggers. Keep under 500 lines.
3. **Bundled resources** — Loaded on demand (scripts/, references/, assets/).

## Skill Anatomy

```
skill-name/
├── SKILL.md                  (required)
│   ├── YAML frontmatter      name + description (required)
│   └── Markdown instructions
└── Bundled Resources         (optional)
    ├── scripts/              Executable code for deterministic/repetitive tasks
    ├── references/           Docs loaded into context as needed
    └── assets/               Output files (templates, icons, boilerplate)
```

**Do NOT include:** setup guides, changelogs, or user-facing documentation — skills are instructions for the agent, not onboarding docs for humans.

---

## Is a Skill the Right Vehicle?

Not every workflow needs a skill. Before creating one, choose the right tool:

| Situation | Use instead |
|---|---|
| A rule that applies to ALL Copilot interactions in this repo | `copilot-instructions.md` entry |
| A rule scoped to specific file types (e.g., always use `kebab-case` for Bicep variable names) | `.github/instructions/*.instructions.md` with `applyTo` glob |
| A one-off prompt you run occasionally | `.github/prompts/*.prompt.md` |
| A multi-step workflow with domain knowledge that benefits from on-demand loading | **Skill** |
| A complex workflow with a dedicated agent persona | `.github/agents/*.agent.md` |

A skill is the right choice when: the workflow is too detailed for `copilot-instructions.md`, it should only load for relevant requests (not every conversation), and it encapsulates reusable domain knowledge or a repeatable process.

If the user's need is better served by a simpler vehicle, say so and use that instead. Not everything needs to be a skill.

---

## Creation Process

### Phase 1 — Discovery

Understand the problem before writing a single line. Ask conversationally:

- What workflow do you want to make consistent? Walk through the steps you do today.
- What goes wrong without the skill? (Inconsistency, forgotten steps, repeated explanation, wrong outputs)
- Who will use this skill? (Just you, your team, public)
- What tools or services are involved?

Collect 2–3 concrete use cases. For each, capture:

```
Trigger:  What the user says/does
Steps:    Sequence of actions
Tools:    Built-in or MCP tools needed
Result:   What success looks like (specific output)
```

Exit criteria: 2–3 use cases defined, success criteria agreed, tools/dependencies identified.

### Phase 2 — Architecture

Make structural decisions before writing:

1. **Choose the primary pattern** — Sequential workflow, iterative refinement, domain-specific intelligence, or multi-tool coordination. Read [references/workflows.md](references/workflows.md) for structure templates and the pattern-selection guide — load it now if you are unsure which pattern fits.
2. **Plan the folder structure** — Only add `scripts/`, `references/`, or `assets/` when there is a clear reason:
   - Same code rewritten repeatedly → `scripts/`
   - Reference material > ~100 lines → `references/`
   - Output uses templates/images → `assets/`
3. **Draft the description** — This is the most important piece. See [Writing the Description](#writing-the-description) below.
4. **Map content to disclosure levels** — What goes in SKILL.md body vs. reference files?

Exit criteria: Pattern selected, folder structure planned, description drafted, content mapped.

### Phase 3 — Craft

Write SKILL.md with precision.

**Frontmatter rules:**

```yaml
---
name: kebab-case-name
description: [What + When + optional Not-when — single line, under 200 words]
---
```

- `name`: kebab-case only, matches the folder name exactly
- `description`: primary trigger mechanism — include trigger phrases, what it does, what it does NOT do
- No other frontmatter fields needed

**Body writing guidelines:**

- Use imperative form: "Search for...", "Create the...", "Validate..."
- Explain WHY behind instructions rather than just MUST/NEVER
- Include 2–3 realistic examples of user inputs and expected outputs
- Put critical instructions at the top, not buried in the middle
- Never wrap prose lines at arbitrary column widths — let paragraphs flow naturally
- Reference bundled files clearly and state exactly WHEN the agent should read them
- **Write for coexistence** — this skill loads alongside other skills in `.github/skills/`. Never assume it is the only skill in context. Avoid generic section headings like "## Overview" that could conflict, and don't claim to handle tasks that belong to another skill in this repo.

Read [references/output-patterns.md](references/output-patterns.md) for patterns on specifying output format (Template, Examples, Scope Communication, Validation Gate) — load it when deciding how to structure the skill's output expectations or examples.

### Phase 4 — Validate

Run the automated validator first:

```bash
python .github/skills/skill-creator/scripts/quick_validate.py .github/skills/<skill-name>
```

Then work through the full [references/quality-checklist.md](references/quality-checklist.md) for description quality scoring, instruction quality scoring, trigger testing, and final sign-off.

**Quick structure checks** (also caught by the script):
- [ ] SKILL.md exists with correct casing (not skill.md or SKILL.MD)
- [ ] Frontmatter has `name` and `description`, correct YAML delimiters (`---`)
- [ ] Folder name is kebab-case matching `name` field
- [ ] No README.md or extra docs in the skill folder
- [ ] Description does NOT contain XML angle brackets `< >`

**Trigger checks** — propose 3–5 test phrases and verify mentally:
- Should trigger: obvious requests, paraphrased versions, informal requests
- Should NOT trigger: unrelated topics, tasks better handled by other skills

**Quality checks:**
- [ ] Every instruction is unambiguous — an agent reading it fresh can follow it without guessing
- [ ] Examples are realistic and complete
- [ ] Referenced files have clear load conditions stated in SKILL.md
- [ ] SKILL.md body is under 500 lines

### Phase 5 — Deliver

If starting a new skill from scratch, scaffold the folder first:

```bash
python .github/skills/skill-creator/scripts/init_skill.py <skill-name>
```

This creates the folder and a template SKILL.md with TODO placeholders. Then fill in the skill content and run the validator before presenting to the user.

Place the completed skill at `.github/skills/<skill-name>/SKILL.md`.

Present a brief summary:
- What the skill does
- Suggested test phrase to try first
- Any bundled resources and when they load

---

## Writing the Description

The `description` field is the primary mechanism that determines whether Copilot invokes the skill. A well-written description is specific, includes trigger phrases, and leans slightly "pushy" — agents tend to undertrigger.

**Structure:** `[What it does] + [When to use it — include actual phrases users would say] + [What NOT to use it for if overlap risk exists]`

**Good example:**
```
Analyze Azure architectures for cost optimization opportunities and provide savings recommendations. Use when reviewing Azure spending, asked to reduce costs, optimize resources, right-size VMs, or find savings across subscriptions. Do NOT use for general architecture design (use architecture-design skill instead).
```

**Bad example:**
```
Helps with Azure cost analysis.
```

**Rules:**
- Include actual phrases users would say, including variations ("create skill", "build a skill", "turn this into a skill", "teach Copilot to do X")
- Include relevant file types or formats if applicable
- Add negative triggers (`Do NOT use for...`) when overlap with other skills is likely
- Keep under 200 words — it loads in every conversation

---

## Progressive Disclosure Patterns

### Pattern 1 — High-level guide with references

Keep core workflow in SKILL.md; move detailed docs to `references/`:

```markdown
## Advanced Features
- **Streaming**: See [references/streaming.md](references/streaming.md) — read when user requests real-time output
- **Error handling**: See [references/errors.md](references/errors.md) — read when diagnosing failures
```

### Pattern 2 — Domain-specific organization

Organize by domain to avoid loading irrelevant context. When a skill spans multiple environments or tool variants, keep only the selection logic in SKILL.md and move per-variant detail into separate files:

```
iac-generator/
├── SKILL.md              (format selection + shared standards)
└── references/
    ├── bicep.md          (read when user chooses Bicep)
    ├── terraform.md      (read when user chooses Terraform)
    ├── arm.md            (read when user chooses ARM templates)
    └── pulumi.md         (read when user chooses Pulumi)
```

Another example — an APIM skill covering multiple environments:

```
apim-deployment/
├── SKILL.md              (shared pipeline and APIOps steps)
└── references/
    ├── github-actions.md (read when deploying via GitHub Actions)
    └── azure-devops.md   (read when deploying via Azure DevOps)
```

### Pattern 3 — Conditional details

Show core content, reference advanced content:

```markdown
## Basic usage
[Core instructions here]

## Advanced: tracked changes
See [references/redlining.md](references/redlining.md) — read only for tracked-change workflows.
```

**Key rule:** Keep reference links one level deep from SKILL.md. For files over 100 lines, add a table of contents at the top.

---

## Bundled Resources Guide

### scripts/

Use when the same code is written repeatedly across invocations, or when deterministic reliability is critical.

- Token-efficient: scripts can be executed without loading into context
- Test scripts by actually running them — don't assume they work
- This skill bundles: `scripts/init_skill.py` (scaffold a new skill folder from template) and `scripts/quick_validate.py` (validate structure, frontmatter, and body against this repo's conventions)

### references/

Use for domain knowledge, API specs, schemas, or detailed guides that exceed what fits cleanly in SKILL.md.

- Load only when needed — always state the condition in SKILL.md
- Avoid duplicating content between SKILL.md and reference files
- This skill bundles: `references/workflows.md` (workflow pattern templates — read during Phase 2), `references/output-patterns.md` (output formatting patterns — read during Phase 3), and `references/quality-checklist.md` (pre-delivery quality checks — read during Phase 4)

### assets/

Use for files that appear in the output Claude produces (not loaded into context, but used in final output).

- Example: `assets/template.docx`, `assets/logo.png`, `assets/hello-world/`

---

## Anti-Patterns

| Anti-pattern | Why it hurts |
|---|---|
| Vague description ("helps with X") | Undertriggering — Copilot won't invoke the skill |
| "When to use" in the body | Body only loads AFTER triggering — too late |
| Wall-of-text instructions | Agent skims and misses critical steps |
| No examples | Agents need concrete input/output pairs |
| README.md inside skill folder | Clutter — agents don't need meta-docs |
| Hardcoded credentials in scripts | Security risk |
| Deeply nested references | Increases cognitive load; keep one level deep |
| SKILL.md over 500 lines | Context bloat on every invocation |
| Overly rigid MUST/NEVER rules | Explain the WHY instead; agents respond better |

---

## Extracting a Skill from an Existing Conversation

When the user says "turn this into a skill" or "capture what we just did", the conversation history is the primary source — mine it before asking a single question.

**Step 1 — Mine the history first.** Read back through the conversation and extract:
- Every tool invoked and in what order
- Each correction or course-change the user made (these are the most valuable signal — they reveal where a naive agent would go wrong)
- Inputs provided and the final output format the user accepted
- Anything the agent had to discover or infer mid-conversation that a fresh agent starting cold would not know

**Step 2 — Identify what's missing.** After mining, you'll have gaps. Common ones:
- Trigger phrases: what would someone say to invoke this workflow?
- Edge cases: what variations of the input exist that the conversation didn't cover?
- Success criteria: how does the user know the output is correct?
- Scope boundaries: what should this skill explicitly NOT handle?

**Step 3 — Ask only targeted gap-filling questions.** Don't dump a full Discovery interview on the user — they just finished the work and want it captured. Ask one or two focused questions maximum, with a suggested default for each: "I'm going to use X as the trigger phrase — does that sound right, or would you phrase it differently?"

**Step 4 — Confirm before writing.** Present a concise summary of what you're going to encode: the workflow steps, the trigger phrases, the success criteria, any bundled resources you plan to create. Get a yes before writing the SKILL.md.

**Step 5 — Generalise, don't transcribe.** The biggest risk here is writing a skill that only works for the exact example in the conversation. Before writing each instruction, ask: "If a different user gives a slightly different input, does this still hold?" Strip out specifics (file names, literal values, one-off workarounds) unless they're universally needed. Encode the pattern, not the instance.

**Step 6 — Proceed through Phases 2–5** — architecture, craft, validate, deliver as normal.

---

## Updating an Existing Skill

When improving rather than creating:

1. Preserve the original `name` field and folder name — do not rename
2. Identify what failed: wrong triggers, missing steps, incorrect outputs, outdated info
3. Edit the minimum necessary — don't refactor surrounding content
4. Generalize from failures rather than adding narrow fixes (avoid overfitting to one example)
5. Re-validate trigger phrases after editing the description

---

## Principles for Writing Effective Instructions

Drawn from AI coding agent best practices:

- **Smallest change that works** — don't add steps or context that don't pull their weight
- **Explain the why** — "Use `DefaultAzureCredential` so credentials are never hardcoded" beats "ALWAYS use `DefaultAzureCredential`"
- **Concrete over abstract** — give exact file paths, command names, expected outputs
- **Prove it works** — after writing a skill, mentally walk through it with a real user prompt
- **Incremental delivery** — if a skill is complex, split it with clear references rather than one monolithic file
- **Read before write** — if the skill involves a codebase or service, instruct the agent to locate existing patterns first
