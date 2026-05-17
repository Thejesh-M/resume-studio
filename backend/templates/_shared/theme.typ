// ── Shared Theme Schema ────────────────────────────────────────────────────
// Each template imports this and calls `resolve-theme(defaults, overrides)` to
// merge user overrides on top of its own defaults.
//
// Colour keys:
//   accent        — primary brand color (headings, rules, links)
//   accent-light  — tinted background for sidebar / header blocks
//   text          — main body text color
//   subtle        — secondary text (dates, locations, labels)
//
// Typography keys:
//   body-font     — font for body text
//   heading-font  — font for name / section headings
//   font-size     — base body font size (pt string, e.g. "10pt")
//   name-size     — candidate name font size (pt string, e.g. "22pt")
//   section-size  — section heading font size relative to body (em string, e.g. "1.05em")
//
// Layout keys (consumed by each template's #set page / spacing calls):
//   page-size       — paper size string: "us-letter" | "a4"
//   margin-top      — top margin (in string, e.g. "0.5in")
//   margin-bottom   — bottom margin (in string, e.g. "0.5in")
//   margin-sides    — left + right margins (in string, e.g. "0.6in")
//   line-spacing    — leading between lines (em string, e.g. "1.1em")
//   section-spacing — gap between sections (pt string, e.g. "6pt")

#let resolve-theme(defaults, overrides) = {
  // Merge: overrides win where present.
  // Colour values: convert hex strings → Typst color via rgb()
  // Measurement values: convert strings → Typst lengths via eval()
  let merged = defaults

  // ── Colours ──────────────────────────────────────────────────────────
  if "accent" in overrides        { merged.insert("accent",       rgb(overrides.accent)) }
  if "accent-light" in overrides  { merged.insert("accent-light", rgb(overrides.at("accent-light"))) }
  if "text" in overrides          { merged.insert("text",         rgb(overrides.text)) }
  if "subtle" in overrides        { merged.insert("subtle",       rgb(overrides.subtle)) }

  // ── Typography ───────────────────────────────────────────────────────
  if "body-font" in overrides     { merged.insert("body-font",    overrides.at("body-font")) }
  if "heading-font" in overrides  { merged.insert("heading-font", overrides.at("heading-font")) }
  if "font-size" in overrides     { merged.insert("font-size",    eval(overrides.at("font-size"))) }
  if "name-size" in overrides     { merged.insert("name-size",    eval(overrides.at("name-size"))) }
  if "section-size" in overrides  { merged.insert("section-size", eval(overrides.at("section-size"))) }

  // ── Layout ───────────────────────────────────────────────────────────
  if "page-size" in overrides       { merged.insert("page-size",       overrides.at("page-size")) }
  if "margin-top" in overrides      { merged.insert("margin-top",      eval(overrides.at("margin-top"))) }
  if "margin-bottom" in overrides   { merged.insert("margin-bottom",   eval(overrides.at("margin-bottom"))) }
  if "margin-sides" in overrides    { merged.insert("margin-sides",    eval(overrides.at("margin-sides"))) }
  if "line-spacing" in overrides    { merged.insert("line-spacing",    eval(overrides.at("line-spacing"))) }
  if "section-spacing" in overrides { merged.insert("section-spacing", eval(overrides.at("section-spacing"))) }

  merged
}
