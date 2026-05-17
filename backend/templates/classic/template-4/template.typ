// ── Classic Template 4 ───────────────────────────────────────────────────
// imprecv-style CV using local cv.typ + utils.typ (no external packages).
// Sections: Work Experience, Education, Affiliations, Projects, Awards,
//           Certificates, Publications, Skills / Languages / Interests, References

#import "cv.typ" as cv
#import "utils.typ"

#let default-theme = (
  headingfont:     "Libertinus Serif",
  bodyfont:        "Libertinus Serif",
  fontsize:        10pt,
  linespacing:     6pt,
  sectionspacing:  0pt,
  showAddress:     true,
  showNumber:      true,
  showTitle:       true,
  headingsmallcaps: false,
  page: (
    paper:        "us-letter",
    margin:       1.25cm,
    numbering:    "1 / 1",
    number-align: "center",
  ),
)

#let render(data, theme: default-theme) = {
  // Build uservars, filling gaps from defaults
  let uservars = (
    headingfont:      theme.at("headingfont",     default: default-theme.headingfont),
    bodyfont:         theme.at("bodyfont",        default: default-theme.bodyfont),
    fontsize:         theme.at("fontsize",        default: default-theme.fontsize),
    linespacing:      theme.at("linespacing",     default: default-theme.linespacing),
    sectionspacing:   theme.at("sectionspacing",  default: default-theme.sectionspacing),
    showAddress:      theme.at("showAddress",     default: default-theme.showAddress),
    showNumber:       theme.at("showNumber",      default: default-theme.showNumber),
    showTitle:        theme.at("showTitle",       default: default-theme.showTitle),
    headingsmallcaps: theme.at("headingsmallcaps",default: default-theme.headingsmallcaps),
    sendnote:         false,
  )

  let pg = theme.at("page", default: default-theme.page)

  // ── Page settings ──
  set page(
    paper:        pg.at("paper",   default: "us-letter"),
    numbering:    pg.at("numbering", default: "1 / 1"),
    number-align: center,
    margin:       pg.at("margin",  default: 1.25cm),
  )

  // ── Typography and heading rules ──
  show: doc => cv.setrules(uservars, doc)
  show: doc => cv.showrules(uservars, doc)

  // ── Sections ──
  cv.cvheading(data, uservars)
  cv.cvwork(data)
  cv.cveducation(data)
  cv.cvaffiliations(data)
  cv.cvprojects(data)
  cv.cvawards(data)
  cv.cvcertificates(data)
  cv.cvpublications(data)
  cv.cvskills(data)
  cv.cvreferences(data)
}
