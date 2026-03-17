#!/usr/bin/env python3
"""Validate a skill folder against this repo's SKILL.md conventions.

Usage:
    python quick_validate.py <path-to-skill-folder>

Exit codes:
    0  pass (warnings are allowed)
    1  fail (at least one structural error)
"""

import re
import sys
from pathlib import Path

KEBAB = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')

TRIGGER_KEYWORDS = (
    'use when', 'use for', 'use this', 'triggers on',
    'asks to', 'asks for', 'says',
)

NEGATIVE_KEYWORDS = (
    'do not use', "don't use", 'not for', 'not intended',
)


def _extract_frontmatter(content):
    """Return (frontmatter_raw, body) or (None, None) if absent/malformed."""
    m = re.match(r'^---[ \t]*\n(.*?)\n---[ \t]*\n', content, re.DOTALL)
    if not m:
        return None, None
    return m.group(1), content[m.end():]


def _parse_frontmatter(fm_raw):
    """Parse top-level key: value pairs. Handles inline and block scalars."""
    result = {}
    lines = fm_raw.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r'^([A-Za-z0-9_-]+)\s*:(.*)', line)
        if not m or line.startswith(' '):
            i += 1
            continue
        key = m.group(1)
        rest = m.group(2).strip()
        if rest in ('|', '>', '|-', '>-', '|+', '>+', ''):
            # Block scalar: collect following indented lines
            parts = []
            i += 1
            while i < len(lines) and (not lines[i] or lines[i][0] in (' ', '\t')):
                parts.append(lines[i].strip())
                i += 1
            result[key] = ' '.join(parts).strip()
        else:
            # Strip surrounding quotes if present
            if len(rest) >= 2 and rest[0] == rest[-1] and rest[0] in ('"', "'"):
                rest = rest[1:-1]
            result[key] = rest
            i += 1
    return result


def validate(skill_path):
    """Return (errors, warnings). errors is empty on pass."""
    errors = []
    warnings = []
    p = Path(skill_path)

    # 1. Folder must exist
    if not p.is_dir():
        return [f"Not a directory: {skill_path}"], []

    # 2. Folder name must be kebab-case
    folder = p.name
    if not KEBAB.match(folder):
        errors.append(
            f"Folder name '{folder}' must be kebab-case "
            f"(lowercase letters, digits, hyphens only)"
        )

    entries = {e.name for e in p.iterdir()}

    # 3. SKILL.md must exist with exact casing
    if 'SKILL.md' not in entries:
        wrong = [n for n in entries if n.lower() == 'skill.md']
        if wrong:
            errors.append(f"Found '{wrong[0]}' — file must be named exactly 'SKILL.md'")
        else:
            errors.append("SKILL.md not found in skill folder")
        return errors, warnings  # nothing more to check

    # 4. No README.md inside the skill folder
    if any(n.lower() == 'readme.md' for n in entries):
        errors.append(
            "README.md found inside the skill folder — remove it "
            "(skills are agent instructions, not human docs)"
        )

    # 5. Read and parse SKILL.md
    content = (p / 'SKILL.md').read_text(encoding='utf-8')
    fm_raw, body = _extract_frontmatter(content)

    if fm_raw is None:
        errors.append(
            "Missing or malformed YAML frontmatter "
            "(expected opening and closing --- delimiters)"
        )
        return errors, warnings

    fm = _parse_frontmatter(fm_raw)

    # 6. name field
    name = fm.get('name', '').strip()
    if not name:
        errors.append("Frontmatter is missing 'name'")
    else:
        if not KEBAB.match(name):
            errors.append(f"name '{name}' must be kebab-case")
        if name != folder:
            warnings.append(
                f"name '{name}' does not match folder name '{folder}' — they should be identical"
            )

    # 7. description field
    desc = fm.get('description', '').strip()
    if not desc:
        errors.append("Frontmatter is missing 'description'")
    else:
        if '<' in desc or '>' in desc:
            errors.append(
                "description contains XML angle brackets (< >) — "
                "this prevents the skill from loading correctly"
            )
        if len(desc) > 1024:
            errors.append(
                f"description is {len(desc)} characters — maximum is 1024"
            )
        if not any(kw in desc.lower() for kw in TRIGGER_KEYWORDS):
            warnings.append(
                "description may be missing trigger guidance — "
                "consider adding 'Use when...' so Copilot knows when to invoke this skill"
            )
        if not any(kw in desc.lower() for kw in NEGATIVE_KEYWORDS):
            warnings.append(
                "description has no negative scope — "
                "consider adding 'Do NOT use for...' if overlap with other skills is a risk"
            )

    # 8. Body line count
    if body:
        line_count = len(body.strip().splitlines())
        if line_count > 500:
            warnings.append(
                f"SKILL.md body is {line_count} lines — "
                f"target is under 500 (move detail to references/)"
            )

    # 9. Reference files should be mentioned in the body
    refs_dir = p / 'references'
    if refs_dir.is_dir() and body:
        for ref in sorted(refs_dir.iterdir()):
            if ref.is_file() and not ref.name.startswith('.'):
                if ref.name not in body and f"references/{ref.name}" not in body:
                    warnings.append(
                        f"references/{ref.name} is not mentioned in SKILL.md — "
                        f"add a link with a 'read when...' condition"
                    )

    return errors, warnings


def main():
    if len(sys.argv) != 2 or sys.argv[1] in ('-h', '--help'):
        print(__doc__)
        sys.exit(0 if '--help' in sys.argv else 1)

    errors, warnings = validate(sys.argv[1])

    print(f"\nValidating: {sys.argv[1]}")
    print('─' * 55)

    for e in errors:
        print(f"  ❌ {e}")
    for w in warnings:
        print(f"  ⚠️  {w}")

    if not errors and not warnings:
        print("  ✅ All checks passed")
    elif not errors:
        n = len(warnings)
        print(f"\n  ✅ Passed with {n} warning{'s' if n != 1 else ''}")
    else:
        e_n, w_n = len(errors), len(warnings)
        print(
            f"\n  ❌ Failed: {e_n} error{'s' if e_n != 1 else ''}, "
            f"{w_n} warning{'s' if w_n != 1 else ''}"
        )

    print()
    sys.exit(0 if not errors else 1)


if __name__ == '__main__':
    main()
