// ── Modern Template ────────────────────────────────────────────────────────
// Single-column with bold accent header bar. Clean sans-serif.
// Section order is driven by data.section_order.

#import "/_shared/theme.typ": resolve-theme

#let default-theme = (
  accent:       rgb("#2563eb"),
  accent-light: rgb("#dbeafe"),
  text:         rgb("#111827"),
  subtle:       rgb("#6b7280"),
  body-font:    "New Computer Modern",
  heading-font: "New Computer Modern",
  font-size:    10pt,
  name-size:    26pt,
  section-size: 0.95em,
)

#let default-section-order = (
  "summary", "experience", "education", "skills", "projects",
  "certifications", "awards", "publications", "languages",
  "interests", "volunteers", "affiliations", "references",
)

#let render(data, theme: default-theme) = {
  set page(paper: "us-letter", margin: (top: 0in, bottom: 0.5in, left: 0.55in, right: 0.55in))
  set text(font: theme.body-font, size: theme.font-size, fill: theme.text)
  set par(justify: true, leading: 0.6em)
  set heading(numbering: none)

  let section(title) = {
    v(10pt)
    stack(dir: ltr, spacing: 6pt,
      box(fill: theme.accent, width: 3pt, height: 1.15em),
      text(theme.section-size, weight: "bold", fill: theme.accent, tracking: 0.08em)[#upper(title)],
    )
    v(1pt)
    line(length: 100%, stroke: 0.4pt + theme.accent-light)
    v(4pt)
  }

  let entry-row(lhs, rhs) = grid(
    columns: (1fr, auto),
    gutter: 4pt,
    lhs,
    align(end)[#rhs],
  )

  // ── Header block with accent background ──
  block(
    fill: theme.accent,
    width: 100% + 1.1in,
    inset: (x: 0.55in, y: 0.3in),
    above: 0pt,
  )[
    #text(theme.name-size, weight: "bold", fill: white)[#data.contact.name]
    #v(4pt)
    #text(9pt, fill: rgb("#bfdbfe"))[
      #data.contact.location
      #if data.contact.at("email", default: none) != none [ | #data.contact.email ]
      #if data.contact.at("phone", default: none) != none [ | #data.contact.phone ]
      #if data.contact.at("linkedin", default: none) != none [ | #data.contact.linkedin ]
      #if data.contact.at("website", default: none) != none [ | #data.contact.website ]
    ]
  ]

  v(4pt)

  let section-order = data.at("section_order", default: default-section-order)

  for key in section-order {

    if key == "summary" {
      if data.at("summary", default: none) != none and data.at("summary", default: "") != "" {
        section("Summary")
        text(9.5pt)[#data.summary]
        v(2pt)
      }
    }

    if key == "experience" {
      if data.at("experience", default: none) != none and data.experience.len() > 0 {
        section("Experience")
        for job in data.experience {
          let loc = job.at("location", default: none)
          entry-row(
            text(weight: "bold")[#job.title],
            text(fill: theme.subtle, size: 9pt)[#job.dates],
          )
          text(fill: theme.accent, size: 9pt, weight: "semibold")[#job.company]
          if loc != none { text(fill: theme.subtle, size: 9pt)[ — #loc] }
          v(3pt)
          for bullet in job.bullets {
            block(inset: (left: 10pt))[
              #box(width: 5pt, height: 5pt, radius: 50%, fill: theme.accent)
              #h(4pt)#text(9.5pt)[#bullet]
            ]
          }
          v(6pt)
        }
      }
    }

    if key == "education" {
      if data.at("education", default: none) != none and data.education.len() > 0 {
        section("Education")
        for edu in data.education {
          let gpa = edu.at("gpa", default: none)
          entry-row(
            text(weight: "bold")[#edu.institution],
            text(fill: theme.subtle, size: 9pt)[#edu.dates],
          )
          text(fill: theme.subtle, size: 9pt)[#edu.degree in #edu.field]
          if gpa != none [ #h(6pt)— GPA: #gpa]
          v(4pt)
        }
      }
    }

    if key == "skills" {
      if data.at("skills", default: none) != none and data.skills.len() > 0 {
        section("Skills")
        for s in data.skills {
          box(
            fill: theme.accent-light,
            inset: (x: 6pt, y: 3pt),
            radius: 3pt,
            text(9pt, fill: theme.accent)[#s]
          )
          h(4pt)
        }
      }
    }

    if key == "projects" {
      if data.at("projects", default: none) != none and data.projects.len() > 0 {
        section("Projects")
        for proj in data.projects {
          entry-row(
            text(weight: "bold")[#proj.name],
            text(fill: theme.subtle, size: 9pt)[#proj.at("dates", default: "")],
          )
          if proj.at("description", default: "") != "" {
            text(9.5pt)[#proj.description]
          }
          v(4pt)
        }
      }
    }

    if key == "certifications" {
      if data.at("certifications", default: none) != none and data.certifications.len() > 0 {
        section("Certifications")
        for cert in data.certifications {
          let date = cert.at("date", default: none)
          block[*#cert.name* — #text(fill: theme.subtle)[#cert.issuer#if date != none [ (#date)]]]
          v(2pt)
        }
      }
    }

    if key == "awards" {
      if data.at("awards", default: none) != none and data.awards.len() > 0 {
        section("Awards")
        for a in data.awards {
          entry-row(
            text(weight: "bold")[#a.title],
            text(fill: theme.subtle, size: 9pt)[#a.at("date", default: "")],
          )
          if a.at("awarder", default: "") != "" {
            text(fill: theme.subtle, size: 9pt)[#a.awarder]
          }
          v(4pt)
        }
      }
    }

    if key == "publications" {
      if data.at("publications", default: none) != none and data.publications.len() > 0 {
        section("Publications")
        for pub in data.publications {
          text(weight: "bold")[#pub.title]
          if pub.at("authors", default: none) != none {
            [\ ]
            text(9pt, fill: theme.subtle)[#pub.authors]
          }
          if pub.at("venue", default: none) != none {
            [\ ]
            text(9pt, style: "italic")[#pub.venue]
          }
          v(4pt)
        }
      }
    }

    if key == "languages" {
      if data.at("languages", default: none) != none and data.at("languages", default: ()).len() > 0 {
        section("Languages")
        text(9.5pt)[#data.languages.join(", ")]
      }
    }

    if key == "interests" {
      if data.at("interests", default: none) != none and data.at("interests", default: ()).len() > 0 {
        section("Interests")
        text(9.5pt)[#data.interests.join(", ")]
      }
    }

    if key == "volunteers" {
      if data.at("volunteers", default: none) != none and data.volunteers.len() > 0 {
        section("Volunteer Experience")
        for v in data.volunteers {
          entry-row(
            text(weight: "bold")[#v.role],
            text(fill: theme.subtle, size: 9pt)[#v.at("dates", default: "")],
          )
          text(fill: theme.subtle, size: 9pt)[#v.organization]
          v(4pt)
        }
      }
    }

    if key == "references" {
      if data.at("references", default: none) != none and data.references.len() > 0 {
        section("References")
        for r in data.references {
          text(weight: "bold")[#r.name]
          if r.at("title", default: none) != none {
            [\ ]
            text(9pt, fill: theme.subtle)[#r.title]
          }
          v(4pt)
        }
      }
    }
  }
}
