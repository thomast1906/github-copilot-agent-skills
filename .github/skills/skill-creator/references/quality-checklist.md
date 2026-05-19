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

## Trigger Testing

Test the description before delivery. Propose 3–5 phrases for each category and verify mentally whether the skill would load.

### Should trigger
1. [ ] `[Most obvious phrasing of the request]` → triggers? Y / N
2. [ ] `[Paraphrased version]` → triggers? Y / N
3. [ ] `[Informal or abbreviated version]` → triggers? Y / N
4. [ ] `[Version that mentions a specific file type or tool]` → triggers? Y / N

### Should NOT trigger
1. [ ] `[Clearly unrelated task]` → stays silent? Y / N
2. [ ] `[Task that belongs to a different skill in this repo]` → stays silent? Y / N
3. [ ] `[Generic question the default agent should handle]` → stays silent? Y / N

If a "should NOT trigger" phrase would activate this skill, the description is too broad. Add a negative scope clause or narrow the trigger wording.

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
