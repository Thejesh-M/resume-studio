// ── Modern Plain Template ──────────────────────────────────────────────────
// Single-column, serif, clean professional layout.
// Uses vendored modern-plain.typ (modernpro-cv package, no external deps).
// Supports: summary, experience, education, skills, projects, awards,
//           publications, certifications, references.

#import "modern-plain.typ" as lib

// Theme stub — colors are fixed inside modern-plain.typ
#let default-theme = (
  font: "New Computer Modern",
)

#let render(data, theme: default-theme) = {
  let contact = data.contact
  let font = theme.at("font", default: "New Computer Modern")

  // Build contacts list (plain text, no fontawesome)
  let contacts = ()
  if contact.at("location", default: none) != none { contacts.push((text: contact.location)) }
  if contact.at("phone",    default: none) != none { contacts.push((text: contact.phone)) }
  if contact.at("email",    default: none) != none { contacts.push((text: contact.email)) }
  if contact.at("linkedin", default: none) != none { contacts.push((text: contact.linkedin)) }
  if contact.at("website",  default: none) != none { contacts.push((text: contact.website)) }

  let sections = ()

  // ── Summary ──
  if data.at("summary", default: none) != none and data.at("summary", default: "") != "" {
    let c = lib.descript(data.summary)
    sections.push(lib.section-block("summary", title: "Summary", c))
  }

  // ── Experience ──
  if data.at("experience", default: none) != none and data.experience.len() > 0 {
    let c = {
      for job-entry in data.experience {
        let bullets = job-entry.bullets.map(b => [- #b]).join()
        lib.job(
          position: job-entry.title,
          institution: job-entry.company,
          location: job-entry.at("location", default: ""),
          date: job-entry.dates,
          description: bullets,
        )
        lib.subsectionsep
      }
    }
    sections.push(lib.section-block("experience", title: "Experience", c))
  }

  // ── Education ──
  if data.at("education", default: none) != none and data.education.len() > 0 {
    let c = {
      for edu in data.education {
        let gpa-note = if edu.at("gpa", default: none) != none { [GPA: #edu.gpa] } else { none }
        lib.education(
          institution: edu.institution,
          major: edu.degree + " in " + edu.field,
          date: edu.dates,
          description: gpa-note,
        )
        lib.subsectionsep
      }
    }
    sections.push(lib.section-block("education", title: "Education", c))
  }

  // ── Skills ──
  if data.at("skills", default: none) != none and data.skills.len() > 0 {
    let all-items = if type(data.skills.at(0)) == dictionary {
      // Standard { category, items } format — flatten all items into one list
      data.skills.map(g => g.at("items", default: ()).join(", ")).join(" | ")
    } else {
      data.skills.join(", ")
    }
    let c = lib.oneline-title-item(title: "Technical Skills", content: all-items)
    sections.push(lib.section-block("skills", title: "Skills", c))
  }

  // ── Projects ──
  if data.at("projects", default: none) != none and data.projects.len() > 0 {
    let c = {
      for proj in data.projects {
        let desc-text = proj.at("description", default: "")
        lib.project(
          proj.name,
          proj.at("dates", default: ""),
          desc-text,
        )
        lib.subsectionsep
      }
    }
    sections.push(lib.section-block("projects", title: "Projects", c))
  }

  // ── Awards ──
  if data.at("awards", default: none) != none and data.awards.len() > 0 {
    let c = {
      for a in data.awards {
        lib.award(
          award: a.title,
          institution: a.at("institution", default: ""),
          date: a.at("date", default: ""),
        )
      }
    }
    sections.push(lib.section-block("awards", title: "Awards", c))
  }

  // ── Publications ──
  // Renders full citation details from JSON (title, authors, journal, volume,
  // number, pages, publisher, date, doi/url, abstract).
  if data.at("publications", default: none) != none and data.publications.len() > 0 {
    let c = {
      for pub in data.publications {
        // Build journal line: Journal, Vol. X, No. Y, pp. Z–Z (Year)
        let journal    = pub.at("journal",   default: none)
        let volume     = pub.at("volume",    default: none)
        let number     = pub.at("number",    default: none)
        let pages      = pub.at("pages",     default: none)
        let publisher  = pub.at("publisher", default: none)
        let doi        = pub.at("doi",       default: none)
        let url        = pub.at("url",       default: none)
        let abstract   = pub.at("abstract",  default: none)
        let date       = pub.at("date",      default: "")

        // Compose venue string
        let venue-parts = ()
        if journal != none   { venue-parts.push(journal) }
        if volume  != none   { venue-parts.push("Vol. " + volume) }
        if number  != none   { venue-parts.push("No. "  + number) }
        if pages   != none   { venue-parts.push("pp. "  + pages) }
        if publisher != none { venue-parts.push(publisher) }
        let venue-str = venue-parts.join(", ")

        // Compose DOI / URL link line
        let link-line = if doi != none {
          "DOI: " + doi
        } else if url != none {
          url
        } else {
          none
        }

        lib.twoline-item(
          entry1: pub.title,
          entry2: date,
          entry3: pub.at("authors", default: ""),
          entry4: if venue-str != "" { venue-str } else { none },
          description: {
            if link-line != none {
              text(9pt, fill: rgb("#444444"), style: "italic", link-line)
              [\ ]
            }
            if abstract != none {
              text(9pt, fill: rgb("#555555"), abstract)
              [\ ]
            }
          },
        )
        lib.subsectionsep
      }
    }
    sections.push(lib.section-block("publications", title: "Publications", c))
  }

  // ── Certifications ──
  if data.at("certifications", default: none) != none and data.certifications.len() > 0 {
    let c = {
      for cert in data.certifications {
        lib.twoline-item(
          entry1: cert.name,
          entry2: cert.at("date", default: ""),
          entry3: cert.issuer,
        )
        lib.subsectionsep
      }
    }
    sections.push(lib.section-block("certifications", title: "Certifications", c))
  }

  // ── References ──
  if data.at("references", default: none) != none and data.references.len() > 0 {
    let c = lib.references(references: data.references)
    sections.push(lib.section-block("references", title: "References", separator: false, c))
  }

  lib.cv-single(
    font-type: font,
    continue-header: "false",
    margin: (left: 1.25cm, right: 1.25cm, top: 1.2cm, bottom: 1.2cm),
    name: contact.name,
    lastupdated: "false",
    pagecount: "false",
    contacts: contacts,
    lib.render-sections(
      sections: sections,
      order: data.at("section_order", default: none),
    )
  )
}
