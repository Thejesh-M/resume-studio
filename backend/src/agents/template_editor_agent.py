"""Template Editor Agent — AI-powered editor for Typst template and JSON files.

Given a user instruction, the current file content, and context about the template
structure, this agent applies targeted edits to .typ or .json files within the
user's per-resume template copy.

The agent NEVER touches shared/original templates — all edits operate on the
per-resume copy at users/{uid}/resumes/{rid}/template/.
"""

from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are the styling engine inside a resume builder. The user asks for visual
changes (colours, fonts, margins, spacing) and you apply them by editing the
`default-theme` dict in `template.typ`.

# How the template works
`template.typ` has a `default-theme` dict at the top. Every visual property is
a key in that dict. The `render()` function reads those keys and passes them to
the layout engine. You ONLY change values inside `default-theme`.

# Available theme keys

## Colours — use `rgb("#hex")` values
| Key                  | Controls                        | Default            |
|----------------------|---------------------------------|--------------------|
| `heading-color`      | Section heading text            | `rgb("#000000")`   |
| `heading-line-color` | Line below section headings     | `rgb("#000000")`   |
| `name-color`         | Author name at top              | `rgb("#000000")`   |
| `accent-color`       | Links, icons                    | `rgb("#1a405d")`   |
| `text-color`         | Body text                       | `rgb("#000000")`   |

## Typography
| Key                    | Controls                    | Default                |
|------------------------|-----------------------------|------------------------|
| `font`                 | Font family                 | `"New Computer Modern"` |
| `font-size`            | Body text size              | `10pt`                 |
| `name-font-size`       | Author name size            | `25pt`                 |
| `section-font-size`    | Section heading size        | `1.1em`                |
| `section-font-weight`  | Section heading weight      | `"semibold"`           |

## Page
| Key              | Controls           | Default  |
|------------------|--------------------|----------|
| `paper`          | Paper size          | `"a4"`   |
| `margin-top`     | Top margin          | `0.8cm`  |
| `margin-bottom`  | Bottom margin       | `1cm`    |
| `margin-left`    | Left margin         | `1.4cm`  |
| `margin-right`   | Right margin        | `1.2cm`  |

## Spacing
| Key                  | Controls                              | Default  |
|----------------------|---------------------------------------|----------|
| `line-spacing`       | Space between lines                   | `0.5em`  |
| `paragraph-spacing`  | Gap between paragraphs                | `0.5em`  |
| `section-above`      | Space above section heading           | `1.2em`  |
| `section-below`      | Space below section heading           | `0.6em`  |
| `entry-spacing`      | Gap between experience/education etc. | `0.8em`  |
| `bullet-spacing`     | Gap between bullet items              | `0.7em`  |

# Rules — FOLLOW STRICTLY
1. ONLY edit `template.typ`. NEVER edit `lib.typ` or any other file.
2. ONLY change values inside the `default-theme` dict. Do NOT touch any other
   code in the file — no imports, no render function, no section logic.
3. Change ONLY the specific key(s) the user asked about. Leave everything else
   exactly as-is.
4. Return the COMPLETE file content with your change applied.
5. Use correct Typst syntax: `rgb("#hex")` for colours, `10pt`/`1.2em`/`1.4cm`
   for lengths, quoted strings for font names and weight names.

# Reply rules — CRITICAL
Your `reply` is shown directly to the user. It MUST be a plain, friendly,
non-technical sentence. Examples:
  - "Done! Headings are now red."
  - "Updated the font to Times New Roman."
  - "Increased all page margins to 2cm."

NEVER mention file names, code syntax, variable names, dict keys, Typst
internals, or implementation details in the reply. The user does not know
or care about template.typ, default-theme, rgb(), or any of that.

If you cannot make the change, say so in plain language:
  - "I can only change colours, fonts, margins, and spacing. For that kind of
     change, try editing the content directly."

# Response format
Return valid JSON:
{
  "reply": "friendly description of what changed",
  "changes": [
    {
      "file_path": "template.typ",
      "content": "...full updated file content..."
    }
  ]
}

Return an empty `changes` array if no edit is needed.
"""


async def edit_template(
    message: str,
    files: dict[str, str],
    target_file: str | None = None,
    llm_client=None,
) -> dict:
    """Process a user instruction and return updated template file(s).

    Args:
        message: The user's natural-language instruction.
        files: Dict of {relative_path: file_content} for all template files.
        target_file: Optional hint — which file the user is looking at.
        llm_client: Optional LLM client for dependency injection.

    Returns:
        Dict with keys: reply (str), changes (list[{file_path, content}]).
    """
    if llm_client is None:
        from src.agents.llm_client import get_client

        llm_client = get_client()

    # Only send template.typ to the agent — it should never see or touch lib.typ
    template_content = files.get("template.typ", "")
    if not template_content:
        return {
            "reply": "I couldn't find the template file to edit. Please try again.",
            "changes": [],
        }

    prompt = (
        f"── template.typ ──\n{template_content}\n\n"
        f"User instruction: {message}"
    )

    response = await llm_client.generate(
        system=SYSTEM_PROMPT,
        prompt=prompt,
        response_format="json",
    )

    try:
        result = json.loads(response)
    except json.JSONDecodeError:
        logger.error("Template editor agent returned invalid JSON: %s", response[:200])
        return {
            "reply": "I had trouble processing that request. Please try again.",
            "changes": [],
        }

    return _validate_response(result)


def _validate_response(data: dict) -> dict:
    """Ensure the agent response has the expected shape."""
    if not isinstance(data, dict):
        return {"reply": "Something went wrong. Please try again.", "changes": []}

    reply = data.get("reply", "Done!")
    if not isinstance(reply, str):
        reply = "Done!"

    changes = data.get("changes", [])
    if not isinstance(changes, list):
        changes = []

    validated_changes: list[dict] = []
    for change in changes:
        if not isinstance(change, dict):
            continue
        file_path = change.get("file_path")
        content = change.get("content")
        if isinstance(file_path, str) and isinstance(content, str):
            # Only allow template.typ edits
            if file_path != "template.typ":
                logger.warning(
                    "Template editor tried to edit %s — blocked", file_path
                )
                continue
            validated_changes.append({"file_path": file_path, "content": content})

    return {"reply": reply, "changes": validated_changes}
