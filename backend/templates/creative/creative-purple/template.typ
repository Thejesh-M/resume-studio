// ── Creative Template ──────────────────────────────────────────────────────
// Bold color header strip, pill section labels, alternating entry backgrounds.
// Suited for design, marketing, and product roles.

#import "/_shared/theme.typ": resolve-theme

#let default-theme = (
  accent:       rgb("#7c3aed"),
  accent-light: rgb("#ede9fe"),
  text:         rgb("#1f1f1f"),
  subtle:       rgb("#6b7280"),
  body-font:    "New Computer Modern",
  heading-font: "New Computer Modern",
  font-size:    10pt,
  name-size:    30pt,
  section-size: 0.85em,
)

#let render(data, theme: default-theme) = {
  set page(paper: "us-letter", margin: (top: 0in, bottom: 0.45in, left: 0in, right: 0in))
  set text(font: theme.body-font, size: theme.font-size, fill: theme.text)
  set par(justify: true, leading: 0.62em)
  set heading(numbering: none)

  let section(title) = {
    v(9pt)
    box(
      fill: theme.accent,
      inset: (x: 10pt, y: 3pt),
      radius: 20pt,
      text(theme.section-size, weight: "bold", fill: white, tracking: 0.08em)[#upper(title)]
    )
    v(5pt)
  }

  let entry-row(lhs, rhs) = grid(
    columns: (1fr, auto),
    gutter: 4pt,
    lhs,
    align(end)[#rhs],
  )

  // ── Full-bleed header ──
  block(width: 100%, fill: theme.accent, inset: (x: 0.5in, top: 0.3in, bottom: 0.25in))[
    #text(theme.name-size, weight: "bold", fill: white)[#data.contact.name]
    #v(6pt)
    #let contacts = (
      data.contact.at("email",    default: none),
      data.contact.at("phone",    default: none),
      data.contact.at("location", default: none),
      data.contact.at("linkedin", default: none),
      data.contact.at("website",  default: none),
    ).filter(v => v != none)
    #text(9pt, fill: rgb("#e9d5ff"))[#contacts.join("  |  ")]
  ]

  line(length: 100%, stroke: 3pt + theme.accent-light)

  // ── Body — use code mode ({}) so loop variables stay in scope ──
  pad(x: 0.5in, {

    // Summary
    if data.at("summary", default: none) != none and data.at("summary", default: "") != "" {
      section("About")
      block(
        fill: theme.accent-light,
        inset: 10pt,
        radius: 6pt,
        width: 100%,
        text(9.5pt, data.summary)
      )
      v(2pt)
    }

    // Experience
    section("Experience")
    for (idx, job) in data.experience.enumerate() {
      let loc     = job.at("location", default: none)
      let bg      = if calc.odd(idx) { theme.accent-light } else { white }
      let inner   = {
        entry-row(
          text(weight: "bold", job.title),
          text(fill: theme.subtle, size: 9pt, style: "italic", job.dates),
        )
        text(fill: theme.accent, size: 9pt, weight: "semibold", job.company)
        if loc != none { text(fill: theme.subtle, size: 9pt, " — " + loc) }
        v(4pt)
        for bullet in job.bullets {
          block(inset: (left: 8pt),
            stack(dir: ltr, spacing: 4pt,
              box(width: 6pt, height: 6pt, radius: 50%, fill: theme.accent),
              text(9.5pt, bullet),
            )
          )
        }
      }
      block(fill: bg, inset: (x: 8pt, y: 6pt), radius: 4pt, width: 100%, inner)
      v(4pt)
    }

    // Skills
    if data.at("skills", default: none) != none and data.skills.len() > 0 {
      section("Skills")
      for s in data.skills {
        box(fill: theme.accent-light, inset: (x: 8pt, y: 4pt), radius: 4pt, text(9pt, fill: theme.accent, s))
        h(4pt)
      }
      v(2pt)
    }

    // Education
    section("Education")
    for edu in data.education {
      let gpa = edu.at("gpa", default: none)
      entry-row(
        text(weight: "bold", edu.institution),
        text(fill: theme.subtle, size: 9pt, edu.dates),
      )
      text(fill: theme.subtle, size: 9pt, edu.degree + " in " + edu.field)
      if gpa != none { text(" — GPA: " + gpa) }
      v(4pt)
    }

    // Certifications
    if data.at("certifications", default: none) != none and data.certifications.len() > 0 {
      section("Certifications")
      for cert in data.certifications {
        let date = cert.at("date", default: none)
        let suffix = if date != none { " (" + date + ")" } else { "" }
        block(
          strong(cert.name) + text(" — ") + text(fill: theme.subtle, cert.issuer + suffix)
        )
        v(2pt)
      }
    }
  })
}
