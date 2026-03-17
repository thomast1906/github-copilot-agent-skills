#!/usr/bin/env python3
"""Scaffold a new skill folder with a template SKILL.md.

Usage:
    python init_skill.py <skill-name> [--path <directory>]

Arguments:
    skill-name  Kebab-case identifier for the skill (e.g. 'my-new-skill')

Options:
    --path      Directory to create the skill in
                Default: .github/skills (relative to current working directory)

Examples:
    python init_skill.py code-review-assistant
    python init_skill.py git-workflow-helper --path .github/skills
"""

import re
import sys
from pathlib import Path


KEBAB = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')

SKILL_TEMPLATE = """\
---
name: {skill_name}
description: >-
  [TODO: What does this skill do? When should Copilot use it?
  Include the actual phrases a user would say to trigger it.
  Add "Do NOT use for..." if there is overlap risk with other
  skills in this repo. Keep under 200 words.]
---

# {skill_title}

[TODO: 1–2 sentences describing what this skill enables. Be concrete — name the
tools, file formats, or workflows it works with.]

---

## Workflow

[TODO: Replace this section with the actual workflow. Choose one primary pattern
from references/workflows.md:

  - Sequential: numbered steps with validation gates between them
  - Conditional: decision tree based on input type or available tools
  - Iterative Refinement: draft → review against criteria → refine → stop condition
  - Multi-Tool Coordination: phase-by-phase with explicit data flow between phases
  - Domain Intelligence: expert pre-checks → action → reasoning

Delete this comment block when done.]

---

## Examples

[TODO: Add 2–3 realistic examples. Each example should show exactly what the user
says and what the agent produces. See references/output-patterns.md for the
Examples Pattern. Concrete examples beat prose descriptions of what output
"should look like". Delete this comment block when done.]

---

## Scope

[TODO: State what this skill does NOT handle if there is any risk of overlap with
other skills in this repo. If no overlap risk exists, delete this section entirely.]
"""


def validate_name(name):
    """Return an error string if invalid, else None."""
    if not KEBAB.match(name):
        return (
            f"'{name}' is not valid kebab-case. "
            f"Use lowercase letters and hyphens only (e.g. 'my-skill')."
        )
    if len(name) > 64:
        return f"'{name}' is too long ({len(name)} chars). Maximum is 64."
    return None


def title_from_name(name):
    """Convert 'my-skill-name' to 'My Skill Name'."""
    return ' '.join(word.capitalize() for word in name.split('-'))


def init_skill(name, base_path):
    err = validate_name(name)
    if err:
        print(f"Error: {err}")
        return 1

    skill_dir = Path(base_path) / name

    if skill_dir.exists():
        print(f"Error: '{skill_dir}' already exists.")
        return 1

    skill_dir.mkdir(parents=True)
    print(f"Created: {skill_dir}/")

    skill_md = skill_dir / 'SKILL.md'
    skill_md.write_text(
        SKILL_TEMPLATE.format(
            skill_name=name,
            skill_title=title_from_name(name),
        ),
        encoding='utf-8',
    )
    print(f"Created: {skill_md}")

    validate_cmd = (
        f"python .github/skills/skill-creator/scripts/quick_validate.py {skill_dir}"
    )

    print(f"""
Next steps:
  1. Edit {skill_dir}/SKILL.md — complete the TODO sections
  2. Run validation when ready:
       {validate_cmd}
  3. Add subdirectories as needed:
       references/  — detailed docs loaded on demand
       scripts/     — executable utilities
       assets/      — templates or output files
""")
    return 0


def main():
    args = sys.argv[1:]

    if not args or args[0] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0)

    skill_name = args[0]
    base_path = '.github/skills'

    if '--path' in args:
        idx = args.index('--path')
        if idx + 1 >= len(args):
            print("Error: --path requires a directory argument")
            sys.exit(1)
        base_path = args[idx + 1]

    sys.exit(init_skill(skill_name, base_path))


if __name__ == '__main__':
    main()
