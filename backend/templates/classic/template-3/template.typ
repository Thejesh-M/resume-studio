// ── Classic Template 3 ───────────────────────────────────────────────────
// Timeline-based professional CV using local cv.typ + layouts/*.typ
// Sections: Summary (prose), Education, Experience, Publications (numbered),
//           Technical Skills (prose, categorized), Projects (timeline), Honors & Awards

#import "cv.typ": setrules, showrules, cvsection
#import "layouts/header.typ": layout-header
#import "utils.typ": convert-string-to-length, convert-string-to-color

#let default-theme = (
  font-heading: "Libertinus Serif",
  font-body: "Libertinus Serif",
  fontsize: "10pt",
  spacing-section: "12pt",
  spacing-entry: "0.1em",
  spacing-element: "3pt",
  spacing-line: "5pt",
  color-hyperlink: "rgb(50, 120, 180)",
  page: (
    paper: "a4",
    margin: "3.5cm",
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
    } else { 3.5cm },
  )

  // ── Typography and heading rules ──
  show: doc => setrules(settings, doc)
  show: doc => showrules(settings, doc)

  // ── Header ──
  layout-header(cv-data, settings)

  // ── Professional Summary ──
  if data.at("statement", default: none) != none and data.statement.len() > 0 {
    cvsection(
      (statement: data.statement),
      layout: "prose",
      section: "statement",
      title: "Professional Summary",
      settings: settings,
    )
  }

  // ── Education ──
  if data.at("education", default: none) != none and data.education.len() > 0 {
    cvsection(
      (
        education: data.education,
        "primary-element": "institution",
        "secondary-element": "title",
      ),
      layout: "timeline",
      section: "education",
      title: "Education",
      settings: settings,
    )
  }

  // ── Professional Experience ──
  if data.at("experience", default: none) != none and data.experience.len() > 0 {
    cvsection(
      (
        experience: data.experience,
        "primary-element": "institution",
        "secondary-element": "title",
        "tertiary-element": "description",
      ),
      layout: "timeline",
      section: "experience",
      title: "Professional Experience",
      settings: settings,
    )
  }

  // ── Publications ──
  if data.at("publications", default: none) != none and data.publications.len() > 0 {
    cvsection(
      (publications: data.publications),
      layout: "numbered-list",
      section: "publications",
      title: "Publications",
      settings: settings,
    )
  }

  // ── Technical Skills ──
  if data.at("skill_groups", default: none) != none and data.skill_groups.len() > 0 {
    cvsection(
      (skill_groups: data.skill_groups),
      layout: "prose",
      section: "skill_groups",
      title: "Technical Skills",
      settings: settings,
    )
  }

  // ── Projects ──
  if data.at("projects", default: none) != none and data.projects.len() > 0 {
    cvsection(
      (
        projects: data.projects,
        "primary-element": "title",
        "secondary-element": "role",
        "tertiary-element": "description",
      ),
      layout: "timeline",
      section: "projects",
      title: "Projects",
      settings: settings,
    )
  }

  // ── Honors & Awards ──
  if data.at("awards", default: none) != none and data.awards.len() > 0 {
    cvsection(
      (
        awards: data.awards,
        "primary-element": ("title", "institution"),
        "tertiary-element": "description",
      ),
      layout: "timeline",
      section: "awards",
      title: "Honors & Awards",
      settings: settings,
    )
  }
}
