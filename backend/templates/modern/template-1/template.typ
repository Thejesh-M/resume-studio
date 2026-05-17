// ── Modern Template 1 ─────────────────────────────────────────────────────
// modern-cv style resume using vendored lib.typ (no external packages).
// Sections: Experience, Projects, Skills, Education.

#import "lib.typ" as lib

#let default-theme = (
  accent-color: "#262F99",
  colored-headers: true,
  paper-size: "us-letter",
)

#let render(data, theme: default-theme) = {
  let p = data.personal

  let accent = theme.at("accent-color", default: default-theme.accent-color)
  let colored = theme.at("colored-headers", default: default-theme.colored-headers)
  let paper = theme.at("paper-size", default: default-theme.paper-size)

  show: lib.resume.with(
    author: (
      firstname: p.at("firstname", default: ""),
      lastname:  p.at("lastname",  default: ""),
      email:     p.at("email",     default: ""),
      phone:     p.at("phone",     default: ""),
      homepage:  p.at("homepage",  default: ""),
      github:    p.at("github",    default: ""),
      linkedin:  p.at("linkedin",  default: ""),
      address:   p.at("address",   default: ""),
      positions: p.at("positions", default: ()),
    ),
    profile-picture: none,
    date: datetime.today().display(),
    language: "en",
    accent-color: accent,
    colored-headers: colored,
    show-footer: false,
    paper-size: paper,
  )

  // ── Experience ──
  if data.at("experience", default: none) != none and data.experience.len() > 0 {
    [= Experience]
    for job in data.experience {
      lib.resume-entry(
        title: job.at("title", default: ""),
        location: job.at("location", default: ""),
        date: job.at("dates", default: ""),
        description: job.at("company", default: ""),
        title-link: job.at("url", default: none),
      )
      lib.resume-item[
        #for b in job.at("bullets", default: ()) [- #eval(b, mode: "markup")]
      ]
    }
  }

  // ── Projects ──
  if data.at("projects", default: none) != none and data.projects.len() > 0 {
    [= Projects]
    for proj in data.projects {
      lib.resume-entry(
        title: proj.at("name", default: ""),
        location: [#lib.github-link(proj.at("location", default: ""))],
        date: proj.at("dates", default: ""),
        description: proj.at("role", default: ""),
      )
      lib.resume-item[
        #for b in proj.at("bullets", default: ()) [- #eval(b, mode: "markup")]
      ]
    }
  }

  // ── Skills ──
  if data.at("skills", default: none) != none and data.skills.len() > 0 {
    [= Skills]
    for s in data.skills {
      lib.resume-skill-item(
        s.at("category", default: ""),
        s.at("items", default: ()),
      )
    }
    block(below: 0.65em)
  }

  // ── Education ──
  if data.at("education", default: none) != none and data.education.len() > 0 {
    [= Education]
    for edu in data.education {
      lib.resume-entry(
        title: edu.at("institution", default: ""),
        location: edu.at("location", default: ""),
        date: edu.at("dates", default: ""),
        description: edu.at("degree", default: ""),
      )
      lib.resume-item[
        #for b in edu.at("bullets", default: ()) [- #eval(b, mode: "markup")]
      ]
    }
  }
}
