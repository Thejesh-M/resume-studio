#import "@preview/fontawesome:0.6.0": fa-version
#fa-version("6")

#import "template.typ": render, default-theme
#let data = json("content.json")
#render(data, theme: default-theme)
