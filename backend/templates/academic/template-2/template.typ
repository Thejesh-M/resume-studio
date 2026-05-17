// ── Academic Template 2 ───────────────────────────────────────────────────
// Timeline-based academic CV using local cv.typ + layouts/*.typ
// Sections: Education, Experience, Publications (numbered), Awards,
//           Grants, Teaching, Service (bullet), Research Interests (bullet),
//           Skills (prose), References (bullet)

#import "cv.typ": setrules, showrules, cvsection
#import "layouts/header.typ": layout-header
#import "utils.typ": convert-string-to-length, convert-string-to-color

#let default-theme = (
  font-heading: "New Computer Modern",
  font-body: "New Computer Modern",
  fontsize: "10pt",
  spacing-section: "12pt",
  spacing-entry: "0.3em",
  spacing-element: "3pt",
  spacing-line: "5pt",
  color-hyperlink: "rgb(0, 80, 160)",
  page: (
    paper: "a4",
    margin: "2.5cm",
    numbering: "1 / 1",
    number-align: "center",
  ),
)

#let render(data, theme: default-theme) = {
  // Merge theme into settings, filling any gaps from defaults
  let settings = default-theme
  for (k, v) in theme {
    settings.insert(k, v)
  }

  // Convert string lengths → actual Typst length values
  let len-keys = ("fontsize", "spacing-line", "spacing-section", "spacing-entry", "spacing-element")
  for k in len-keys {
    settings.at(k) = convert-string-to-length(settings.at(k))
  }
  if "page" in settings and "margin" in settings.page {
    settings.page.margin = convert-string-to-length(settings.page.margin)
  }
  settings.color-hyperlink = convert-string-to-color(settings.color-hyperlink)

  // Convenience: pull personal sub-dict
  let personal-data = data.at("personal", default: (:))

  // Build the personal structure expected by layout-header
  let personal = (
    name:     personal-data.at("name", default: ""),
    titles:   personal-data.at("titles", default: none),
    location: personal-data.at("location", default: none),
    contact:  personal-data.at("contact",  default: (:)),
    profiles: personal-data.at("profiles", default: ()),
  )

  // cv-data for the header (header.typ filters sections with layout == "header")
  let cv-data = (
    personal: personal,
    sections: (
      (key: "personal", layout: "header", "show": true,
       "include": ("titles", "location", "contact")),
    ),
  )

  // ── Page settings ──
  set page(
    paper: if "page" in settings and "paper" in settings.page {
      settings.page.paper
    } else { "a4" },
    numbering: if "page" in settings and "numbering" in settings.page {
      settings.page.numbering
    } else { "1 / 1" },
    number-align: if "page" in settings and "number-align" in settings.page {
      let a = settings.page.number-align
      if a == "center" { center } else if a == "left" { left } else { right }
    } else { center },
    margin: if "page" in settings and "margin" in settings.page {
      settings.page.margin
    } else { 2.5cm },
  )

  // ── Typography and heading rules ──
  show: doc => setrules(settings, doc)
  show: doc => showrules(settings, doc)

  // ── Header ──
  layout-header(cv-data, settings)

  // ── Education ──
  if data.at("education", default: none) != none and data.education.len() > 0 {
    cvsection(
      (
        education: data.education,
        "primary-element": "institution",
        "secondary-element": "degree",
        "tertiary-element": "advisors",
      ),
      layout: "timeline",
      section: "education",
      title: "Education",
      settings: settings,
    )
  }

  // ── Academic Positions / Experience ──
  if data.at("experience", default: none) != none and data.experience.len() > 0 {
    cvsection(
      (
        experience: data.experience,
        "primary-element": "institution",
        "secondary-element": ("role", "supervisors"),
      ),
      layout: "timeline",
      section: "experience",
      title: "Academic Positions",
      settings: settings,
    )
  }

  // ── Publications ──
  if data.at("publications", default: none) != none and data.publications.len() > 0 {
    cvsection(
      (publications: data.publications),
      layout: "numbered-list",
      section: "publications",
      title: "Selected Publications",
      settings: settings,
    )
  }

  // ── Grants & Funding ──
  if data.at("grants", default: none) != none and data.grants.len() > 0 {
    cvsection(
      (
        grants: data.grants,
        "primary-element": "title",
        "secondary-element": ("institution", "role"),
      ),
      layout: "timeline",
      section: "grants",
      title: "Grants & Funding",
      settings: settings,
    )
  }

  // ── Awards & Honors ──
  if data.at("awards", default: none) != none and data.awards.len() > 0 {
    cvsection(
      (
        awards: data.awards,
        "primary-element": "title",
        "secondary-element": "awarder",
      ),
      layout: "timeline",
      section: "awards",
      title: "Awards & Honors",
      settings: settings,
    )
  }

  // ── Teaching ──
  if data.at("teaching", default: none) != none and data.teaching.len() > 0 {
    cvsection(
      (
        teaching: data.teaching,
        "primary-element": "role",
        "secondary-element": "institution",
      ),
      layout: "timeline",
      section: "teaching",
      title: "Teaching",
      settings: settings,
    )
  }

  // ── Professional Service ──
  if data.at("service", default: none) != none and data.service.len() > 0 {
    cvsection(
      (service: data.service),
      layout: "bullet-list",
      section: "service",
      title: "Professional Service",
      settings: settings,
    )
  }

  // ── Research Interests ──
  if data.at("research_interests", default: none) != none and data.research_interests.len() > 0 {
    cvsection(
      (research_interests: data.research_interests),
      layout: "bullet-list",
      section: "research_interests",
      title: "Research Interests",
      settings: settings,
    )
  }

  // ── Skills ──
  if data.at("skills", default: none) != none and data.skills.len() > 0 {
    cvsection(
      (skills: data.skills),
      layout: "prose",
      section: "skills",
      title: "Skills",
      settings: settings,
    )
  }

  // ── References ──
  if data.at("references", default: none) != none and data.references.len() > 0 {
    let ref-lines = data.references.map(r => {
      let parts = (r.at("name", default: ""),)
      if r.at("role", default: none) != none { parts.push(r.role) }
      if r.at("institution", default: none) != none { parts.push(r.institution) }
      parts.join(" — ")
    })
    cvsection(
      (references: ref-lines),
      layout: "bullet-list",
      section: "references",
      title: "References",
      settings: settings,
    )
  }
}
