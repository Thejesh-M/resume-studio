// ── Academic Serif Template ───────────────────────────────────────────────
// Uses vendored lib.typ (pro-academic-cv package, no external deps).
// Section order is driven by data.section_order — a list of section keys.
// Contact is always rendered first (not reorderable).

#import "lib.typ" as lib

// ── Theme ──────────────────────────────────────────────────────────────────
// Every visual knob lives here. The AI editor ONLY modifies this dict.
#let default-theme = (
  // Colours
  heading-color:      rgb("#000000"),   // section heading text
  heading-line-color: rgb("#000000"),   // line below section headings
  name-color:         rgb("#000000"),   // author name
  accent-color:       rgb("#1a405d"),   // links, icons
  text-color:         rgb("#000000"),   // body text

  // Typography
  font:               "New Computer Modern",
  font-size:          10pt,
  name-font-size:     25pt,
  section-font-size:  1.1em,
  section-font-weight: "semibold",

  // Page
  paper:              "a4",
  margin-top:         0.8cm,
  margin-bottom:      1cm,
  margin-left:        1.4cm,
  margin-right:       1.2cm,

  // Spacing
  line-spacing:       0.5em,       // paragraph leading
  paragraph-spacing:  0.5em,       // gap between paragraphs
  section-above:      1.2em,       // space above section heading
  section-below:      0.6em,       // space below section heading
  entry-spacing:      0.8em,       // gap between experience/education entries
  bullet-spacing:     0.7em,       // gap between bullet items
)

// Default section order — used when data doesn't include section_order
#let default-section-order = (
  "summary", "experience", "education", "skills", "projects",
  "certifications", "awards", "publications", "languages",
  "interests", "volunteers", "affiliations", "references",
)

#let render(data, theme: default-theme) = {
  let contact = data.contact

  // ── Read every theme value with safe defaults ──
  let heading-color    = theme.at("heading-color",      default: rgb("#000000"))
  let heading-line-clr = theme.at("heading-line-color",  default: rgb("#000000"))
  let name-color       = theme.at("name-color",         default: rgb("#000000"))
  let accent-color     = theme.at("accent-color",       default: rgb("#1a405d"))
  let text-color       = theme.at("text-color",         default: rgb("#000000"))

  let font             = theme.at("font",               default: "New Computer Modern")
  let font-size        = theme.at("font-size",          default: 10pt)
  let name-font-size   = theme.at("name-font-size",     default: 25pt)
  let section-fsize    = theme.at("section-font-size",   default: 1.1em)
  let section-fweight  = theme.at("section-font-weight", default: "semibold")

  let paper            = theme.at("paper",              default: "a4")
  let margin-top       = theme.at("margin-top",         default: 0.8cm)
  let margin-bottom    = theme.at("margin-bottom",      default: 1cm)
  let margin-left      = theme.at("margin-left",        default: 1.4cm)
  let margin-right     = theme.at("margin-right",       default: 1.2cm)

  let line-spacing     = theme.at("line-spacing",       default: 0.5em)
  let paragraph-spacing= theme.at("paragraph-spacing",  default: 0.5em)
  let section-above    = theme.at("section-above",      default: 1.2em)
  let section-below    = theme.at("section-below",      default: 0.6em)
  let entry-spacing    = theme.at("entry-spacing",      default: 0.8em)
  let bullet-spacing   = theme.at("bullet-spacing",     default: 0.7em)

  // Build author-info for the resume header
  let primary-parts = ()
  if contact.at("phone",    default: none) != none { primary-parts.push(contact.phone) }
  if contact.at("email",    default: none) != none {
    primary-parts.push(link("mailto:" + contact.email)[#contact.email])
  }
  if contact.at("website",  default: none) != none {
    primary-parts.push(link("https://" + contact.website)[#contact.website])
  }
  let primary-info = primary-parts.join(" | ")

  let secondary-parts = ()
  if contact.at("linkedin", default: none) != none {
    secondary-parts.push(link("https://" + contact.linkedin)[linkedin])
  }
  if contact.at("github",   default: none) != none {
    secondary-parts.push(link("https://github.com/" + contact.github)[github])
  }
  let secondary-info = if secondary-parts.len() > 0 { secondary-parts.join(" | ") } else { none }

  let tertiary-info = contact.at("location", default: none)

  // ── Section order ──
  let section-order = data.at("section_order", default: default-section-order)

  // ── Build body by iterating section_order ──
  let body = {
    for key in section-order {

      // ── Summary / Objective ──
      if key == "summary" {
        if data.at("summary", default: none) != none and data.at("summary", default: "") != "" {
          [== Objective]
          [#data.summary]
        }
      }

      // ── Experience ──
      if key == "experience" {
        if data.at("experience", default: none) != none and data.experience.len() > 0 {
          [== Experience]
          let entries = data.experience.map(job => (
            entry-header-args: (
              top-left:    job.company,
              top-right:   job.dates,
              bottom-left: job.title,
              bottom-right: job.at("location", default: ""),
            ),
            list-items: job.bullets.map(b => [#b]),
          ))
          lib.r2c2-entry-list(spacing: entry-spacing, ..entries)
        }
      }

      // ── Education ──
      if key == "education" {
        if data.at("education", default: none) != none and data.education.len() > 0 {
          [== Education]
          let entries = data.education.map(edu => {
            let degree = edu.at("degree", default: edu.at("studyType", default: ""))
            let field  = edu.at("field",  default: edu.at("area",      default: ""))
            let gpa    = edu.at("gpa",    default: edu.at("score",     default: none))
            let items  = if gpa != none { ([GPA: #gpa],) } else { ([],) }
            (
              entry-header-args: (
                top-left:    edu.institution,
                top-right:   edu.dates,
                bottom-left: degree + " in " + field,
                bottom-right: edu.at("location", default: ""),
              ),
              list-items: items,
            )
          })
          lib.r2c2-entry-list(spacing: entry-spacing, ..entries)
        }
      }

      // ── Skills ──
      if key == "skills" {
        if data.at("skills", default: none) != none and data.skills.len() > 0 {
          [== Skills]
          if type(data.skills) == array and type(data.skills.at(0)) == dictionary {
            let lines = data.skills.map(group =>
              lib.single-line-entry(
                group.at("category", default: "") + ":",
                group.at("items", default: ()).join(", "),
                []
              )
            )
            lib.multi-line-list(..lines)
          } else if type(data.skills) == array {
            lib.multi-line-list(
              lib.single-line-entry("Technical Skills:", data.skills.join(", "), [])
            )
          } else {
            let lines = data.skills.pairs().map(pair =>
              lib.single-line-entry(pair.at(0) + ":", pair.at(1).join(", "), [])
            )
            lib.multi-line-list(..lines)
          }
        }
      }

      // ── Projects ──
      if key == "projects" {
        if data.at("projects", default: none) != none and data.projects.len() > 0 {
          [== Projects]
          let entries = data.projects.map(proj => {
            let proj-url = proj.at("url", default: "")
            let src-url  = proj.at("source_code", default: "")
            let tl = if proj-url != "" { link(proj-url)[#proj.name] } else { proj.name }
            let br = if src-url  != "" { link(src-url)[#lib.link-icon()] } else { "" }
            let roles     = proj.at("roles", default: ())
            let tools     = proj.at("tools", default: "")
            let bl        = if roles.len() > 0 { roles.join(", ") } else if tools != "" { "Tools: " + tools } else { "" }
            let highlights = proj.at("highlights", default: proj.at("bullets", default: ()))
            (
              entry-header-args: (
                top-left: tl, top-right: proj.at("dates", default: ""),
                bottom-left: bl, bottom-right: br,
              ),
              list-items: highlights.map(h => [#h]),
            )
          })
          lib.r2c2-entry-list(spacing: entry-spacing, ..entries)
        }
      }

      // ── Certifications ──
      if key == "certifications" {
        if data.at("certifications", default: none) != none and data.certifications.len() > 0 {
          [== Certifications]
          let lines = data.certifications.map(cert =>
            lib.single-line-entry(
              cert.name,
              if cert.at("issuer", default: "") != "" { "Issued by: " + cert.issuer } else { "" },
              cert.at("date", default: ""),
            )
          )
          lib.multi-line-list(..lines)
        }
      }

      // ── Awards ──
      if key == "awards" {
        if data.at("awards", default: none) != none and data.awards.len() > 0 {
          [== Honors~&~Awards]
          let entries = data.awards.map(a => {
            let a-url   = a.at("url", default: "")
            let awarder = a.at("awarder", default: a.at("institution", default: ""))
            let summary = a.at("summary", default: "")
            let title-content = if a-url != "" { link(a-url)[#a.title] } else { a.title }
            let items = if summary != "" { ([#summary],) } else { ([],) }
            (
              entry-header-args: (
                top-left:    title-content,
                top-right:   a.at("date", default: ""),
                bottom-left: awarder,
                bottom-right: "",
              ),
              list-items: items,
            )
          })
          lib.r2c2-entry-list(spacing: entry-spacing, ..entries)
        }
      }

      // ── Publications ──
      if key == "publications" {
        if data.at("publications", default: none) != none and data.publications.len() > 0 {
          [== Patents~&~Publications (note:C=Conference, J=Journal, P=Patent, S=In Submission, T=Thesis)]
          let entries = data.publications.map(pub => {
            let cat    = pub.at("category", default: "J")
            let title  = pub.title
            let authors= pub.at("authors",   default: "")
            let venue  = pub.at("venue",     default: pub.at("journal",   default: ""))
            let date   = pub.at("date",      default: pub.at("releaseDate", default: ""))
            let doi    = pub.at("doi",       default: none)
            let url    = pub.at("url",       default: none)
            let title-content = if doi != none {
              link("https://doi.org/" + doi)[*#title*]
            } else if url != none {
              link(url)[*#title*]
            } else { [*#title*] }
            let venue-part = if venue != "" { emph(venue) + [. ] } else { [] }
            let val = [#authors (#date). #title-content. #venue-part]
            (category: cat, value: val)
          })
          lib.publication-entry-list(entries)
        }
      }

      // ── Languages ──
      if key == "languages" {
        if data.at("languages", default: none) != none and data.at("languages", default: ()).len() > 0 {
          [== Languages]
          [#data.languages.join(", ")]
        }
      }

      // ── Interests ──
      if key == "interests" {
        if data.at("interests", default: none) != none and data.at("interests", default: ()).len() > 0 {
          [== Interests]
          [#data.interests.join(", ")]
        }
      }

      // ── Volunteers ──
      if key == "volunteers" {
        if data.at("volunteers", default: none) != none and data.volunteers.len() > 0 {
          [== Volunteer Experience]
          let entries = data.volunteers.map(v => {
            let v-url = v.at("url", default: "")
            let br    = if v-url != "" { link(v-url)[#lib.link-icon()] } else { "" }
            (
              entry-header-args: (
                top-left:    v.at("role", default: v.at("position", default: "")),
                top-right:   v.at("dates", default: ""),
                bottom-left: v.at("organization", default: ""),
                bottom-right: br,
              ),
              list-items: v.at("highlights", default: v.at("bullets", default: ())).map(h => [#h]),
            )
          })
          lib.r2c2-entry-list(spacing: entry-spacing, ..entries)
        }
      }

      // ── Affiliations (memberships) ──
      if key == "affiliations" {
        if data.at("affiliations", default: none) != none and data.affiliations.len() > 0 {
          [== Professional Memberships]
          let lines = data.affiliations.map(m =>
            lib.single-line-entry(
              m.at("organization", default: "") + ",",
              if m.at("role", default: "") != "" { m.role } else { "" },
              m.at("dates", default: ""),
            )
          )
          lib.multi-line-list(..lines)
        }
      }

      // ── References ──
      if key == "references" {
        if data.at("references", default: ()) != none and data.at("references", default: ()).len() > 0 {
          [== References]
          let items = data.references.map(r => (
            name:  r.name,
            title: r.at("title", default: none),
            org:   r.at("institution", default: r.at("org", default: none)),
            email: r.at("email", default: none),
            phone: r.at("phone", default: none),
            note:  r.at("note",  default: r.at("relationship", default: none)),
          ))
          lib.personal-info-list(items)
        }
      }
    }
  }

  // ── Render ──
  show: lib.resume.with(
    margin: (left: margin-left, right: margin-right, top: margin-top, bottom: margin-bottom),
    paper: paper,
    font-settings: (
      font-family: font,
      font-size:   font-size,
      author-font-size: name-font-size,
      lang: "en",
    ),
    par-settings: (
      leading: line-spacing,
      spacing: paragraph-spacing,
    ),
    list-settings: (
      bullet-list-spacing: bullet-spacing,
      numbered-list-spacing: bullet-spacing,
    ),
    heading-settings: (
      above-spacing: section-above,
      below-spacing: section-below,
      section-title-size: section-fsize,
      section-title-weight: section-fweight,
      section-note-size: 0.8em,
      section-note-weight: "light",
      section-line-above-spacing: -0.85em,
      line-length: 100%,
      line-stroke: 0.04em + heading-line-clr,
      heading-color: heading-color,
    ),
    author-info: (
      name:           contact.name,
      primary-info:   primary-info,
      secondary-info: secondary-info,
      tertiary-info:  tertiary-info,
      name-color:     name-color,
    ),
    author-position: center,
    text-color: text-color,
    accent-color: accent-color,
  )
  body
}
