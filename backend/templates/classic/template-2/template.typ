// ── Classic Template 2 ─────────────────────────────────────────────────────
// Single-column, serif, clean and professional with accent-colored headings.
// Based on the fantastic-cv style with section dividers and entry headings.

#import "/_shared/theme.typ": resolve-theme

#let default-theme = (
  accent:       rgb("#26428b"),
  accent-light: rgb("#eef0f8"),
  text:         rgb("#1a1a1a"),
  subtle:       rgb("#555555"),
  body-font:    "New Computer Modern",
  heading-font: "New Computer Modern",
  font-size:    10pt,
  name-size:    15pt,
  section-size: 1.3em,
)

#let render(data, theme: default-theme) = {
  let font-size = theme.font-size
  let font_size_title = theme.name-size
  let font_size_section = theme.section-size
  let font_size_entry = font-size * 1.1

  let render_space_between_highlight = -0.5em
  let render_space_between_entry = -0.5em
  let render_space_between_sections = -0.5em

  set text(
    font: theme.body-font,
    size: font-size,
    lang: "en",
    ligatures: false,
  )

  set page(
    margin: (top: 0.5in, bottom: 0.5in, left: 0.5in, right: 0.5in),
    paper: "a4",
  )

  set par(justify: true)

  show link: underline

  show heading: set text(fill: theme.accent)

  show link: set text(fill: theme.accent)

  // name heading
  show heading.where(level: 1): it => [#text(font_size_title, weight: "extrabold")[#it]]

  // section heading
  show heading.where(level: 2): it => [#text(font_size_section, weight: "bold")[#it]]

  // entry heading
  show heading.where(level: 3): it => [#text(size: font_size_entry, weight: "semibold")[#it]]

  // ── Helper functions ──

  let _get_dates(item) = {
    item.at("dates", default: "")
  }

  let _entry_heading(main: "", dates: "", description: "", bottom_right: "") = {
    [
      === #main #h(1fr) #dates \
      #description #h(1fr) #bottom_right
    ]
  }

  let _section(title, body) = {
    [ == #smallcaps(title)]
    v(-0.5em)
    line(length: 100%, stroke: stroke(thickness: 0.4pt))
    v(-0.5em)
    body
    v(render_space_between_sections)
  }

  // ── Header ──

  let contact = data.contact

  set document(
    author: contact.name,
    title: contact.name,
    description: "Resume of " + contact.name,
    keywords: "resume, cv, curriculum vitae",
  )

  let location = contact.at("location", default: "")

  align(
    left,
    [= #contact.name #h(1fr) #location],
  )

  pad(
    top: 0.25em,
    [
      #{
        let items = (
          contact.at("phone", default: none),
          if contact.at("email", default: none) != none { link(contact.email)[#contact.email] },
          if contact.at("website", default: none) != none { link(contact.website)[#contact.website] },
        )
        items.filter(x => x != none).join("  |  ")
        let profiles = contact.at("profiles", default: ())
        if profiles.len() > 0 {
          "  |  "
          profiles
            .map(profile => {
              profile.network + ": "
              link(profile.url)[#profile.username]
            })
            .join("  |  ")
        }
      }
    ],
  )

  // ── Education ──

  if data.at("education", default: none) != none and data.education.len() > 0 {
    let section_body = {
      data.education
        .map(education => {
          let main = link(education.at("url", default: ""))[#education.institution]
          let edu_url = education.at("url", default: "")
          if edu_url.len() == 0 {
            main = education.institution
          }
          _entry_heading(
            main: main,
            dates: _get_dates(education),
            description: (
              emph(education.studyType),
              education.area,
              "GPA: " + strong(education.score),
            ).join(" | "),
            bottom_right: education.at("location", default: ""),
          )
          let courses = education.at("courses", default: ())
          if courses.len() > 0 {
            [
              - #emph[Selected coursework]: #courses.join(", ")
            ]
          }
        })
        .join(v(render_space_between_entry))
    }
    _section("Education", section_body)
  }

  // ── Work Experience ──

  if data.at("experience", default: none) != none and data.experience.len() > 0 {
    let section_body = {
      data.experience
        .map(work => {
          let main = link(work.at("url", default: ""))[#work.company]
          let work_url = work.at("url", default: "")
          if work_url.len() == 0 {
            main = work.company
          }
          [
            #_entry_heading(
              main: main,
              dates: _get_dates(work),
              description: (
                emph(work.title),
                work.at("description", default: ""),
              ).filter(x => x != "").join(" | "),
              bottom_right: work.at("location", default: ""),
            )
            #work.bullets.map(it => [- #it]).join(v(render_space_between_highlight))
          ]
        })
        .join(v(render_space_between_entry))
    }
    _section("Work", section_body)
  }

  // ── Projects ──

  if data.at("projects", default: none) != none and data.projects.len() > 0 {
    let section_body = {
      data.projects
        .map(project => {
          let proj_url = project.at("url", default: "")
          let main = if proj_url.len() > 0 { link(proj_url)[#project.name] } else { project.name }
          let source_code_url = project.at("source_code", default: "")
          let source_code = if source_code_url.len() > 0 { link(source_code_url)[Source code] } else { "" }
          let roles = project.at("roles", default: ())
          [
            #_entry_heading(
              main: main,
              dates: _get_dates(project),
              description: roles.map(emph).join(" | "),
              bottom_right: source_code,
            )
            #v(-2em) \
            #project.at("description", default: "")
            #project.at("highlights", default: ()).map(it => [- #it]).join(v(render_space_between_highlight))
          ]
        })
        .join(v(render_space_between_entry))
    }
    _section("Projects", section_body)
  }

  // ── Volunteering ──

  if data.at("volunteers", default: none) != none and data.volunteers.len() > 0 {
    let section_body = {
      data.volunteers
        .map(volunteer => {
          let vol_url = volunteer.at("url", default: "")
          let main = if vol_url.len() > 0 { link(vol_url)[#volunteer.organization] } else { volunteer.organization }
          [
            #_entry_heading(
              main: main,
              dates: _get_dates(volunteer),
              description: emph(volunteer.position),
              bottom_right: volunteer.at("location", default: ""),
            )
            #v(-2em) \
            #volunteer.at("summary", default: "")
            #volunteer.at("highlights", default: ()).map(it => [- #it]).join(v(render_space_between_highlight))
          ]
        })
        .join(v(render_space_between_entry))
    }
    _section("Volunteering", section_body)
  }

  // ── Awards ──

  if data.at("awards", default: none) != none and data.awards.len() > 0 {
    let section_body = [
      #(
        data.awards
          .map(award => {
            let awarder_str = if award.at("awarder", default: "").len() > 0 { " - Awarded by " + award.awarder } else { "" }
            let prefix = if award.at("url", default: "").len() > 0 { link(award.url)[#award.title] } else { award.title }
            let summary_str = if award.at("summary", default: "").len() > 0 { [#award.summary] } else { "" }
            [- #prefix#awarder_str #h(1fr) #award.date \ #summary_str]
          })
          .join(v(render_space_between_highlight))
      )
    ]
    _section("Awards", section_body)
  }

  // ── Certificates ──

  if data.at("certificates", default: none) != none and data.certificates.len() > 0 {
    let section_body = data.certificates
      .map(certificate => {
        let post_fix = h(1fr) + certificate.date
        let issue_str = if certificate.at("issuer", default: "").len() > 0 { " - issued by " + certificate.issuer } else { "" }
        let prefix = if certificate.at("url", default: "").len() > 0 { link(certificate.url)[#certificate.name] } else { certificate.name }
        [- #prefix#issue_str #post_fix]
      })
      .join(v(render_space_between_highlight))
    _section("Certificates", section_body)
  }

  // ── Publications ──
  // Renders full citation details from JSON (title, authors, journal, volume,
  // number, pages, publisher, date, doi/url, abstract).

  if data.at("publications", default: none) != none and data.publications.len() > 0 {
    let section_body = {
      data.publications
        .map(pub => {
          let journal   = pub.at("journal",   default: none)
          let volume    = pub.at("volume",    default: none)
          let number    = pub.at("number",    default: none)
          let pages     = pub.at("pages",     default: none)
          let publisher = pub.at("publisher", default: none)
          let doi       = pub.at("doi",       default: none)
          let url       = pub.at("url",       default: none)
          let abstract  = pub.at("abstract",  default: none)
          let date      = pub.at("date",      default: "")
          let authors   = pub.at("authors",   default: "")

          // Compose venue string: Journal, Vol. X, No. Y, pp. Z–Z (Publisher)
          let venue-parts = ()
          if journal   != none { venue-parts.push(journal) }
          if volume    != none { venue-parts.push("Vol. " + volume) }
          if number    != none { venue-parts.push("No. "  + number) }
          if pages     != none { venue-parts.push("pp. "  + pages) }
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

          // Title line with date
          let title-content = [
            === #pub.title #h(1fr) #date \
            #text(style: "italic")[#authors]
            #if venue-str != "" [ #h(1fr) #text(size: 9pt)[#venue-str]]
          ]

          [
            #title-content
            #if link-line != none [
              #text(9pt, fill: rgb("#444444"), style: "italic")[#link-line] \
            ]
            #if abstract != none [
              #text(9pt, fill: rgb("#555555"))[#abstract] \
            ]
          ]
        })
        .join(v(render_space_between_entry))
    }
    _section("Publications", section_body)
  }

  // ── Custom Sections ──

  if data.at("custom_sections", default: none) != none {
    for custom_section in data.custom_sections {
      let section_body = {
        custom_section.highlights
          .map(highlight => {
            let summary_str = highlight.summary + ": "
            let description_str = highlight.at("description", default: "")
            if description_str.len() == 0 {
              description_str = ""
            }
            [- #text(weight: "bold")[#summary_str]#description_str]
          })
          .join(v(render_space_between_highlight))
      }
      _section(custom_section.title, section_body)
    }
  }
}