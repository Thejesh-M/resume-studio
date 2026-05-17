// ── Two Column Template 2 ─────────────────────────────────────────────────
// Teal accent sidebar | light background main area.
// Matches metronic/fontawesome layout without external package dependencies.
// Supports: summary, experience (with per-entry tags), education,
//           skill_groups, skills (flat), certifications, projects, awards.

#import "/_shared/theme.typ": resolve-theme

#let default-theme = (
  accent:       rgb("#61B7AE"),
  accent-light: rgb("#F2F0EF"),
  text:         rgb("#1a1a1a"),
  subtle:       rgb("#555555"),
  body-font:    "New Computer Modern",
  heading-font: "New Computer Modern",
  font-size:    10pt,
  name-size:    22pt,
  section-size: 0.95em,
)

// ── Internal helpers ──

#let _pill(label, accent) = box(
  fill: accent.lighten(50%),
  inset: (x: 7pt, y: 3pt),
  radius: 4pt,
  text(9pt, fill: accent.darken(40%), weight: "medium", label)
)

#let _pills(items, accent) = {
  for item in items { _pill(item, accent); h(3pt) }
}

#let _section-title(label, accent, on-dark) = {
  let fill = if on-dark { white } else { accent }
  text(theme.section-size, weight: "bold", fill: fill, upper(label))
  v(5pt)
}

#let render(data, theme: default-theme) = {
  let contact = data.contact
  let accent  = theme.accent
  let bg      = theme.accent-light

  // Sidebar text is white on the teal background
  let sidebar-text = white
  let main-text    = theme.text

  set page(paper: "a4", margin: 0pt)
  set text(font: theme.body-font, size: theme.font-size)

  // ── Sidebar content ──
  let sidebar = pad(x: 16pt, y: 20pt, {
    set text(fill: sidebar-text)

    // Name + title
    text(theme.name-size, weight: "bold")[#contact.name]
    linebreak()
    if contact.at("title", default: none) != none {
      text(12pt, weight: "semibold", fill: white.darken(15%))[#contact.title]
    }
    v(8pt)

    // Summary
    if data.at("summary", default: none) != none and data.at("summary", default: "") != "" {
      text(9pt)[#data.summary]
      v(12pt)
    }

    // Contact details
    let entries = (
      if contact.at("email",    default: none) != none { "✉  " + contact.email },
      if contact.at("phone",    default: none) != none { "☎  " + contact.phone },
      if contact.at("linkedin", default: none) != none { "in  " + contact.linkedin },
      if contact.at("location", default: none) != none { "⌖  " + contact.location },
      if contact.at("website",  default: none) != none { "⊕  " + contact.website },
    ).filter(x => x != false and x != none)
    for entry in entries { text(9pt)[#entry]; linebreak() }
    v(12pt)

    // Education
    if data.at("education", default: none) != none and data.education.len() > 0 {
      text(theme.section-size, weight: "bold")[Education]
      v(5pt)
      for edu in data.education {
        let degree = edu.at("degree", default: edu.at("studyType", default: ""))
        let field  = edu.at("field",  default: edu.at("area",      default: ""))
        let dates  = edu.at("dates",  default: "")
        text(9.5pt, weight: "semibold")[#edu.institution]
        linebreak()
        text(8.5pt, style: "italic")[#degree in #field]
        linebreak()
        text(8pt, fill: white.darken(20%))[#dates]
        if edu.at("gpa", default: edu.at("score", default: none)) != none {
          let gpa = edu.at("gpa", default: edu.at("score", default: ""))
          text(8pt, "  •  GPA: " + gpa)
        }
        v(7pt)
      }
      v(5pt)
    }

    // Grouped skills (skill_groups)
    if data.at("skill_groups", default: none) != none {
      for group in data.skill_groups {
        text(theme.section-size, weight: "bold")[#group.name]
        v(5pt)
        _pills(group.skills, accent.darken(20%))
        v(10pt)
      }
    }

    // Flat skills fallback
    if data.at("skills", default: none) != none and data.skills.len() > 0 {
      text(theme.section-size, weight: "bold")[Skills]
      v(5pt)
      _pills(data.skills, accent.darken(20%))
      v(10pt)
    }

    // Certifications
    if data.at("certifications", default: none) != none and data.certifications.len() > 0 {
      text(theme.section-size, weight: "bold")[Certifications]
      v(5pt)
      for cert in data.certifications {
        let date = cert.at("date", default: "")
        text(9pt, weight: "semibold")[#cert.name]
        linebreak()
        text(8pt, fill: white.darken(20%))[#cert.issuer#if date != "" { "  (" + date + ")" }]
        v(5pt)
      }
    }
  })

  // ── Main content ──
  let main = pad(x: 20pt, y: 20pt, {
    set text(fill: main-text)

    // Experience
    if data.at("experience", default: none) != none and data.experience.len() > 0 {
      text(theme.section-size, weight: "bold", fill: accent)[Professional Experience]
      line(length: 100%, stroke: 0.5pt + accent)
      v(6pt)

      for job in data.experience {
        let loc  = job.at("location", default: none)
        let tags = job.at("tags", default: ())

        grid(
          columns: (1fr, auto),
          text(10.5pt, weight: "bold")[#job.title],
          text(9pt, fill: theme.subtle, style: "italic")[#job.dates],
        )
        text(9.5pt, fill: accent, weight: "semibold")[#job.company]
        if loc != none { text(9pt, fill: theme.subtle, "  •  " + loc) }
        v(4pt)
        for bullet in job.bullets {
          block(inset: (left: 8pt))[
            #box(width: 4pt, height: 4pt, radius: 50%, fill: accent)
            #h(4pt)#text(9.5pt)[#bullet]
          ]
        }
        if tags.len() > 0 {
          v(5pt)
          _pills(tags, accent)
        }
        v(10pt)
      }
    }

    // Projects
    if data.at("projects", default: none) != none and data.projects.len() > 0 {
      text(theme.section-size, weight: "bold", fill: accent)[Projects]
      line(length: 100%, stroke: 0.5pt + accent)
      v(6pt)
      for proj in data.projects {
        let proj-url   = proj.at("url",         default: "")
        let src-url    = proj.at("source_code",  default: "")
        let roles      = proj.at("roles",        default: ())
        let highlights = proj.at("highlights",   default: ())
        let desc       = proj.at("description",  default: none)
        let tags       = proj.at("tags",         default: ())
        let dates      = proj.at("dates",        default: "")

        grid(
          columns: (1fr, auto),
          if proj-url != "" { text(10pt, weight: "bold")[#link(proj-url)[#proj.name]] }
          else              { text(10pt, weight: "bold")[#proj.name] },
          text(9pt, fill: theme.subtle, style: "italic")[#dates],
        )
        if roles.len() > 0 {
          text(9pt, fill: accent, roles.map(r => emph(r)).join(" | "))
        }
        if desc != none { v(2pt); text(9.5pt)[#desc] }
        for h-item in highlights {
          block(inset: (left: 8pt))[
            #box(width: 4pt, height: 4pt, radius: 50%, fill: accent)
            #h(4pt)#text(9.5pt)[#h-item]
          ]
        }
        if tags.len() > 0 { v(4pt); _pills(tags, accent) }
        if src-url != "" { v(2pt); text(8pt, fill: accent)[#link(src-url)[Source code]] }
        v(10pt)
      }
    }

    // Awards
    if data.at("awards", default: none) != none and data.awards.len() > 0 {
      text(theme.section-size, weight: "bold", fill: accent)[Awards]
      line(length: 100%, stroke: 0.5pt + accent)
      v(6pt)
      for a in data.awards {
        let a-url    = a.at("url",     default: "")
        let awarder  = a.at("awarder", default: "")
        let summary  = a.at("summary", default: "")
        let date     = a.at("date",    default: "")
        grid(
          columns: (1fr, auto),
          if a-url != "" { text(9.5pt, weight: "semibold")[#link(a-url)[#a.title]] }
          else           { text(9.5pt, weight: "semibold")[#a.title] },
          text(9pt, fill: theme.subtle)[#date],
        )
        if awarder != "" { text(9pt, fill: theme.subtle)[#awarder] }
        if summary != "" { linebreak(); text(9pt)[#summary] }
        v(6pt)
      }
    }

    // Custom sections
    if data.at("custom_sections", default: none) != none {
      for cs in data.custom_sections {
        text(theme.section-size, weight: "bold", fill: accent)[#cs.title]
        line(length: 100%, stroke: 0.5pt + accent)
        v(6pt)
        for hl in cs.highlights {
          block(inset: (left: 8pt))[
            #text(9.5pt, weight: "bold")[#hl.summary: ]
            #text(9.5pt)[#hl.at("description", default: "")]
          ]
        }
        v(8pt)
      }
    }
  })

  // ── Two-column page layout ──
  grid(
    columns: (1.9fr, 3fr),
    fill: (x, _) => if x == 0 { accent } else { bg },
    sidebar,
    main,
  )
}
