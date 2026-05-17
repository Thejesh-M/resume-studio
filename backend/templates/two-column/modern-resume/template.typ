// ── Two-Column Template ────────────────────────────────────────────────────
// Uses vendored lib.typ (modern-resume package, no external deps).
// Dark header ribbon with contact icons, two-column body.

#import "lib.typ": modern-resume, experience, project, pill, default-theme

// Re-export default-theme so build.typ and compiler can reference it.
#let default-theme = default-theme

#let render(data, theme: default-theme) = {
  let contact = data.contact

  // Build contact-options dict from available fields
  let contact-opts = (:)
  if contact.at("email",    default: none) != none { contact-opts.insert("email",    contact.email) }
  if contact.at("mobile",   default: none) != none { contact-opts.insert("mobile",   contact.mobile) }
  if contact.at("phone",    default: none) != none { contact-opts.insert("mobile",   contact.phone) }
  if contact.at("location", default: none) != none { contact-opts.insert("location", contact.location) }
  if contact.at("linkedin", default: none) != none { contact-opts.insert("linkedin", contact.linkedin) }
  if contact.at("website",  default: none) != none { contact-opts.insert("website",  contact.website) }

  let job-title = contact.at("title", default: "")

  modern-resume(
    author: contact.name,
    job-title: job-title,
    bio: data.at("summary", default: none),
    contact-options: contact-opts,
    theme: theme,
  )[
    // ── Experience ──
    == Work Experience

    #for job in data.experience [
      #experience(
        title: job.title,
        subtitle: job.company,
        facility-description: job.at("location", default: ""),
        task-description: [
          #for bullet in job.bullets [- #bullet
          ]
        ],
        date-from: job.dates,
        date-to: "",
        label: "",
        theme: theme,
      )
    ]

    // ── Education ──
    == Education

    #for edu in data.education [
      #let gpa-str = if edu.at("gpa", default: none) != none { " — GPA: " + edu.gpa } else { "" }
      #experience(
        title: edu.degree + " in " + edu.field,
        subtitle: edu.institution,
        date-from: edu.dates,
        date-to: "",
        label: "",
        theme: theme,
      )
    ]

    #colbreak()

    // ── Skills ──
    #if data.at("skills", default: none) != none and data.skills.len() > 0 [
      == Skills

      #for s in data.skills [
        #pill(s, fill: true, theme: theme)
      ]
    ]

    // ── Certifications ──
    #if data.at("certifications", default: none) != none and data.certifications.len() > 0 [
      == Certifications

      #for cert in data.certifications [
        #let date = cert.at("date", default: none)
        #project(
          title: cert.name,
          subtitle: cert.issuer,
          date-from: if date != none { date } else { "" },
          theme: theme,
        )
      ]
    ]
  ]
}
