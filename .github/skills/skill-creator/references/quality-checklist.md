# Quality Checklist

Use at the end of Phase 4 — Validate — before delivering any skill.

---

## Structural Checks (Pass / Fail)

Hard requirements. Fix every failure before delivery.

- [ ] Folder name is kebab-case (lowercase letters, digits, and hyphens only — no spaces, underscores, or capitals)
- [ ] `SKILL.md` exists with exact casing (not `skill.md`, `Skill.md`, or `SKILL.MD`)
- [ ] YAML frontmatter is present with `---` as both opening and closing delimiter
- [ ] `name` field is present and kebab-case
- [ ] `name` value matches the folder name exactly
- [ ] `description` field is present
- [ ] `description` is under 1024 characters
- [ ] `description` contains no XML angle brackets (`<` or `>`)
- [ ] No `README.md` or `CHANGELOG.md` inside the skill folder

Run `scripts/quick_validate.py` to check these automatically.

---

## Description Quality (Score 1–5, target 4+ on all)

| Dimension | 1 (poor) | 5 (excellent) |
|---|---|---|
| **Specificity** | "Helps with things" | Names exact workflows, file types, or tools |
| **Trigger clarity** | Vague — agent can't tell when to load it | Includes the actual phrases a user would type |
| **User language** | Internal jargon or technical terms | Words a user would naturally say in a chat |
| **Scope boundary** | No boundary stated | Explicit "Do NOT use for..." where overlap exists |
| **Assertiveness** | Passive ("can be used to…") | Direct ("Use when…", "Use for…") |

A description scoring below 4 on trigger clarity will undertrigger — the agent simply won't invoke the skill when it should.

---

## Instruction Quality (Score 1–5, target 4+ on all)

| Dimension | 1 (poor) | 5 (excellent) |
|---|---|---|
| **Actionability** | Vague direction ("validate properly") | Exact command, path, or tool call |
| **Examples** | None | 2–3 concrete examples with realistic inputs and outputs |
| **Error handling** | Silent on failure | Specific failure modes named with recovery steps |
| **Progressive disclosure** | Wall of text in SKILL.md | Focused body, heavy detail in `references/` |
| **Coexistence** | Claims ownership of broad tasks | Scoped clearly; no overlap with other skills in the repo |

---

## Trigger Evaluation

Test the description before delivery. For meaningful new skills or trigger-sensitive updates, create a small trigger set rather than relying on a few obvious examples.

### Should trigger
1. [ ] 8-10 prompts cover obvious wording, paraphrases, informal wording, contextual wording, and file/tool/domain-specific wording
2. [ ] Each should-trigger prompt has a clear concept or branch represented in the description
3. [ ] The set includes at least one prompt that does not literally say "skill" but clearly needs the workflow

### Should NOT trigger
1. [ ] 8-10 near-miss prompts cover adjacent skills, one-off prompts, repo-wide instruction requests, and generic tasks
2. [ ] Negative prompts are genuinely confusable, not obviously unrelated filler
3. [ ] The description includes a boundary when a near miss would otherwise trigger

If should-trigger prompts are weakly covered, add the missing branch or user phrasing. If should-not-trigger prompts match too easily, narrow the description or add a negative scope clause. See `references/evaluation.md` for the full process.

---

## Behavior Evaluation

Use this for meaningful new skills or execution-changing updates. Skip only when the change is purely mechanical and the reason is obvious.

- [ ] 2-4 realistic eval prompts exist
- [ ] For a new skill, output is compared against a without-skill baseline when practical
- [ ] For an existing skill update, output is compared against the old skill or a pre-edit snapshot when practical
- [ ] Evals include the main workflow and at least one edge case or branch
- [ ] Optional assertions are objective and checkable
- [ ] User-facing or subjective outputs receive qualitative review
- [ ] Iteration stops when success criteria pass, returns diminish, or the user accepts the tradeoff

---

## Existing Skill Update Check

When updating an existing skill:

- [ ] Existing folder name and `name` frontmatter are preserved unless the user explicitly requested a rename
- [ ] Current behavior or current failure mode is captured before editing
- [ ] Git diff is checked before editing so unrelated user changes are not overwritten
- [ ] The update generalizes beyond a single failed prompt
- [ ] Stale or conflicting old guidance is removed when new guidance replaces it
- [ ] Relevant trigger or behavior evals are rerun after editing

---

## Bundled Resources Check

If the skill includes `references/`, `scripts/`, or `assets/`:

- [ ] Every file in `references/` is linked from the SKILL.md body with a clear "read when..." condition
- [ ] Every script in `scripts/` has been run locally at least once (don't assume it works)
- [ ] No bundled file duplicates content already in the SKILL.md body

---

## Final Sign-Off

- [ ] User has reviewed and confirmed the skill captures their intent correctly
- [ ] Test phrases above produce expected triggering behaviour
- [ ] SKILL.md body line count is under 500
- [ ] Skill is placed at `.github/skills/<skill-name>/SKILL.md` and is discoverable via the skills index
