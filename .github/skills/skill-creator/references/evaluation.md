# Evaluation Workflow

Use during Phase 4 when creating a meaningful new skill, changing an existing skill's trigger behavior, or changing instructions that affect execution quality.

The goal is to test whether the skill makes the agent follow a better process across realistic requests. Do not build evals from toy prompts; use prompts that resemble how someone would actually ask for the work.

---

## 1. Trigger Evaluation

Use this when drafting or changing the `description` field.

Create a small trigger set:

- 8-10 should-trigger prompts
- 8-10 should-not-trigger prompts

Should-trigger prompts should cover:

- The obvious wording: "create a skill for X"
- Paraphrases: "teach Copilot to do X consistently"
- Informal wording: "can we turn this workflow into something reusable?"
- Contextual wording that does not name the skill directly but clearly needs it
- File, tool, or domain terms the intended users will actually mention

Should-not-trigger prompts should be near misses, not unrelated filler:

- Requests sharing vocabulary but needing a different skill
- One-off tasks better handled by `.github/prompts/`
- Repo-wide rules better handled by `copilot-instructions.md`
- Generic coding/debugging questions where a skill would add noise

Revise the description when:

- A should-trigger prompt lacks any clear phrase or concept in the description
- A should-not-trigger prompt matches the description too easily
- The description repeats the same branch using multiple synonyms instead of covering distinct branches
- The negative scope is missing for an obvious overlap with another skill

Keep the final description direct, single-line, and under the repo's character limit.

---

## 2. Behavior Evaluation

Use this when the skill should change how the agent performs work, not just when it triggers.

Create 2-4 realistic eval prompts. Each eval should include:

```json
{
  "id": "descriptive-id",
  "prompt": "Realistic user request",
  "expected_output": "What a good result should include",
  "files": []
}
```

Good eval prompts are specific enough to expose the skill's value:

- Include realistic constraints, file names, repo paths, tool names, or business context
- Cover the main workflow and at least one edge case or branch
- Ask for an output the user can inspect
- Avoid revealing the implementation details that the skill is supposed to teach

For an existing skill update, keep at least one eval that reproduces the failure or weakness that motivated the update, plus one nearby case to guard against overfitting.

---

## 3. Compare Skill Against Baseline

For a new skill, compare:

- `with_skill`: agent follows the new skill
- `without_skill`: agent receives the same task without the skill

For an existing skill update, compare:

- `new_skill`: agent follows the updated skill
- `old_skill`: agent follows the previous version or a snapshot taken before editing

The comparison does not need to be elaborate for every skill. For narrow edits, a written side-by-side review may be enough. For higher-risk or reusable skills, save outputs under an eval workspace so later iterations are traceable:

```text
<skill-name>-evals/
├── iteration-1/
│   ├── <eval-id>/
│   │   ├── with_skill/
│   │   └── baseline/
│   └── notes.md
└── iteration-2/
```

Track what matters for the skill:

- Did the agent follow the intended process?
- Did it use the correct tools, files, or references?
- Did it avoid known failure modes?
- Was the result more complete, accurate, or maintainable than the baseline?
- Did the skill add unnecessary work or verbosity?

---

## 4. Assertions

Use assertions when success can be checked objectively. Do not force numeric grading onto subjective output.

Good assertions:

- "Includes a valid `name` and `description` in YAML frontmatter"
- "Does not create `README.md` inside the skill folder"
- "References every file in `references/` from `SKILL.md` with a load condition"
- "Preserves the existing skill name during an update"

Weak assertions:

- "Looks good"
- "Is comprehensive"
- "Sounds professional"

For code, SDK, infrastructure, or policy skills, prefer expected and forbidden patterns where possible. If the same assertion will be reused often, consider a script instead of manual review.

---

## 5. Qualitative Review

After eval outputs exist, review them as a user would:

- Read the prompt first, then the output, without relying on the intended fix.
- Note specific misses, unnecessary steps, confusing output, or places where the baseline performed just as well.
- Separate failures caused by the skill from failures caused by missing user context.
- Treat empty or positive feedback as useful evidence, but look for repeated weak spots across prompts.

When sharing results with the user, keep it brief:

- Which evals passed clearly
- Which evals exposed issues
- What change you recommend next

---

## 6. Iterate and Stop

After each eval pass:

1. Generalize from failures into concise instruction changes.
2. Remove or rewrite guidance that caused confusion.
3. Add scripts or references only when repeated work appears across evals.
4. Rerun the relevant trigger or behavior evals.

Stop when:

- The trigger set has no obvious undertriggering or overtriggering
- Behavior evals pass the agreed success criteria
- Further changes are only polishing without changing agent behavior
- The user accepts the current tradeoff

If an eval keeps failing for reasons outside the skill's scope, document the limitation rather than bloating the skill to chase it.
