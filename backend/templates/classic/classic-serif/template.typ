// ── Classic Serif Template ─────────────────────────────────────────────────
// Single-column, modern-plain style. ATS-optimised.
// Sections: Summary, Experience, Education, Skills, Certifications.

#import "../../modern/modern-plain/modern-plain.typ" as lib
#import "@preview/fontawesome:0.6.0": fa-icon

#let default-theme = (
  font: "New Computer Modern",
)

#let _icon(name) = box(fa-icon(name, fill: rgb("#000000")))

#let render(data, theme: default-theme) = {
  let contact = data.contact
  let font = theme.at("font", default: "New Computer Modern")

  let contacts = ()
  if contact.at("location", default: none) != none {
    contacts.push((text: [#_icon("location-dot") #contact.location]))
  }
  if contact.at("phone", default: none) != none {
    contacts.push((text: [#_icon("square-phone") #contact.phone]))
  }
  if contact.at("email", default: none) != none {
    contacts.push((text: [#_icon("envelope") #contact.email], link: "mailto:" + contact.email))
  }
  if contact.at("linkedin", default: none) != none {
    contacts.push((text: [#_icon("linkedin") #contact.linkedin], link: "https://" + contact.linkedin))
  }
  if contact.at("website", default: none) != none {
    contacts.push((text: [#_icon("globe") #contact.website], link: "https://" + contact.website))
  }

  let sections = ()

  // ── Summary ──
  if data.at("summary", default: none) != none and data.at("summary", default: "") != "" {
    sections.push(lib.section-block("summary", title: "Summary",
      lib.descript(data.summary)
    ))
  }

  // ── Experience ──
  if data.at("experience", default: none) != none and data.experience.len() > 0 {
    let c = {
      for job in data.experience {
        let bullets = job.bullets.map(b => [- #b]).join()
        lib.job(
          position: job.title,
          institution: job.company,
          location: job.at("location", default: ""),
          date: job.dates,
          description: bullets,
        )
        lib.subsectionsep
      }
    }
    sections.push(lib.section-block("experience", title: "Experience", c))
  }

  // ── Skills ──
  if data.at("skills", default: none) != none and data.skills.len() > 0 {
    let skill-content = {
      for grp in data.skills {
        lib.oneline-title-item(
          title: grp.category,
          content: grp.items.join(", "),
        )
      }
    }
    sections.push(lib.section-block("skills", title: "Skills", skill-content))
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

  // ── Certifications ──
  if data.at("certifications", default: none) != none and data.certifications.len() > 0 {
    let c = {
      for cert in data.certifications {
        lib.oneline-two(
          entry1: cert.name + " — " + cert.at("issuer", default: ""),
          entry2: cert.at("date", default: ""),
        )
      }
    }
    sections.push(lib.section-block("certifications", title: "Certifications", c))
  }

  lib.cv-single(
    font-type: font,
    name: contact.name,
    contacts: contacts,
    lastupdated: "false",
    pagecount: "true",
    lib.render-sections(
      sections: sections,
      order: data.at("section_order", default: none),
    )
  )
}
