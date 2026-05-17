// ── Cover Letter Template 1 ───────────────────────────────────────────────
// modern-cv style cover letter using vendored lib.typ (no external packages).

#import "lib.typ" as lib

#let default-theme = (
  accent-color: "#262F99",
  paper-size: "us-letter",
)

#let render(data, theme: default-theme) = {
  let p = data.personal
  let e = data.at("entity", default: (:))

  let accent = theme.at("accent-color", default: default-theme.accent-color)
  let paper  = theme.at("paper-size",   default: default-theme.paper-size)

  show: lib.coverletter.with(
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
    language: "en",
    accent-color: accent,
    show-footer: false,
    closing: [],
    paper-size: paper,
  )

  lib.hiring-entity-info(
    entity-info: (
      target:         e.at("target",         default: ""),
      name:           e.at("name",           default: ""),
      "street-address": e.at("street-address", default: ""),
      city:           e.at("city",           default: ""),
    ),
  )

  lib.letter-heading(
    job-position: data.at("role",      default: ""),
    addressee:    data.at("addressee", default: ""),
  )

  for section in data.at("sections", default: ()) {
    [= #section.heading]
    [#section.body]
  }
}
