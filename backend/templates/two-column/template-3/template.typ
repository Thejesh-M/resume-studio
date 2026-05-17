// ── Two Column Template 3 ────────────────────────────────────────────────
// nabcv-style: sidebar (contact, skills, values, hobbies, references,
// publications) + main column (summary, motivation, experience, education,
// awards, courses) with optional timeline.
// Uses vendored lib.typ — no external package dependencies.

#import "lib.typ": cv

#let default-theme = (
  accent:       rgb("#0D47A1"),
  accent-light: rgb("#F5F1ED"),
  text:         rgb("#000000"),
  subtle:       rgb("#6B6B6B"),
  body-font:    "New Computer Modern",
  heading-font: "New Computer Modern",
  font-size:    10pt,
  name-size:    32pt,
  section-size: 11.5pt,
)

#let render(data, theme: default-theme) = {
  let contact = data.contact

  // ── Profiles (LinkedIn / GitHub) ──
  let profiles = ()
  if contact.at("linkedin", default: none) != none {
    profiles.push((network: "LinkedIn", username: contact.linkedin))
  }
  if contact.at("github", default: none) != none {
    profiles.push((network: "GitHub", username: contact.github))
  }

  // ── Experience → cv() shape ──
  // cv() expects: {company, start_date, end_date, position, location, summary, highlights}
  let experience = if data.at("experience", default: none) != none {
    data.experience.map(job => (
      company:    job.company,
      start_date: job.dates,    // passed as-is; format-date returns it unchanged if not ISO
      end_date:   none,
      position:   job.title,
      location:   job.at("location", default: none),
      summary:    job.at("summary",  default: none),
      highlights: job.at("bullets",  default: job.at("highlights", default: ())),
    ))
  } else { none }

  // ── Education → cv() shape (same as experience) ──
  let education = if data.at("education", default: none) != none {
    data.education.map(edu => {
      let degree = edu.at("degree", default: edu.at("studyType", default: ""))
      let field  = edu.at("field",  default: edu.at("area",      default: ""))
      let gpa    = edu.at("gpa",    default: edu.at("score",     default: none))
      let hl     = edu.at("courses", default: ())
      if gpa != none { hl = ("GPA: " + gpa,) + hl }
      (
        company:    edu.institution,
        start_date: edu.dates,
        end_date:   none,
        position:   degree + " in " + field,
        location:   edu.at("location", default: none),
        summary:    none,
        highlights: hl,
      )
    })
  } else { none }

  // ── Awards → cv() shape ──
  let awards = if data.at("awards", default: none) != none {
    data.awards.map(a => (
      name:    a.at("title",   default: a.at("name",    default: "")),
      date:    a.at("date",    default: ""),
      summary: a.at("awarder", default: none),
    ))
  } else { none }

  // ── Courses / Certifications → cv() courses shape ──
  let courses = if data.at("certifications", default: none) != none {
    data.certifications.map(c => (
      name:    c.name,
      date:    c.at("date", default: ""),
      summary: c.at("issuer", default: none),
    ))
  } else { none }

  // ── Skills → cv() shape: array of {group, items} ──
  let skills = if data.at("skill_groups", default: none) != none {
    data.skill_groups.map(g => (group: g.name, items: g.skills))
  } else if data.at("skills", default: none) != none and data.skills.len() > 0 {
    ((group: "Technical Skills", items: data.skills),)
  } else { none }

  // ── Publications → cv() shape: array of {title, doi} ──
  let publications = if data.at("publications", default: none) != none {
    data.publications.map(pub => (
      title: pub.title,
      doi:   pub.at("doi", default: none),
    ))
  } else { none }

  // ── References ──
  let references = if data.at("references", default: none) != none {
    data.references.map(r => r.name + " — " + r.at("institution", default: r.at("org", default: "")))
  } else { none }

  // ── Values + Hobbies ──
  let values  = data.at("values",  default: none)
  let hobbies = data.at("hobbies", default: none)

  // ── Theme overrides for cv() ──
  let cv-theme = (
    primary:    theme.text,
    secondary:  theme.accent,
    accent:     theme.subtle,
    links:      theme.accent,
    sidebar-bg: theme.accent-light,
    summary:    theme.subtle,
  )

  cv(
    name:       contact.name,
    headline:   contact.at("title",    default: none),
    location:   contact.at("location", default: none),
    keywords:   data.at("keywords",    default: none),
    email:      contact.at("email",    default: none),
    phone:      contact.at("phone",    default: none),
    address:    contact.at("address",  default: none),
    profiles:   if profiles.len() > 0 { profiles } else { none },
    summary:    data.at("summary",     default: none),
    motivation: data.at("motivation",  default: none),
    experience: experience,
    education:  education,
    awards:     awards,
    courses:    courses,
    skills:     skills,
    values:     values,
    hobbies:    hobbies,
    references: references,
    publications: publications,
    theme:      cv-theme,
    text-size:  (
      header-name: theme.name-size,
      section-title: theme.section-size,
      body: theme.font-size,
      sidebar: theme.font-size,
    ),
    font-family: (
      header-name:      theme.heading-font,
      header-headline:  theme.body-font,
      header-location:  theme.body-font,
      header-tags:      theme.body-font,
      section-title:    theme.heading-font,
      body:             theme.body-font,
      entry-text:       theme.body-font,
      entry-highlight:  theme.body-font,
      summary:          theme.body-font,
    ),
    show-timeline: true,
    []
  )
}
