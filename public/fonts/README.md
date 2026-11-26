# Fonts

All fonts are self-hosted: Google Fonts is blocked or unreliable on the client's
network, so no page depends on it.

| Face | Files | Licence | Used for |
|---|---|---|---|
| Manrope (variable, 200–800) | `manrope-latin-var.woff2`, `manrope-latin-ext-var.woff2` | SIL OFL 1.1 | The only Latin face on the site (client decision). |
| Arboria, Bely Display | `Arboria-*.ttf`, `BelyDisplay-Regular.ttf` | supplied by the client | The seven x seven landing only. |
| IBM Plex Sans Arabic (provisional) | `ibm-plex-sans-arabic/*.woff2`, weights 200–700 | `LICENSE-IBM-Plex-Sans-Arabic.txt` (SIL OFL 1.1) | Arabic characters on pages in Arabic. |
| Noto Sans JP (variable, provisional) | `noto-sans-jp/files/*.woff2` | `LICENSE-Noto-Sans-JP.txt` (SIL OFL 1.1) | Japanese characters on pages in Japanese. |

The Arabic and Japanese faces are provisional until the client approves them.
They are loaded only by pages in that language (`/locales/ar.css`,
`/locales/ja.css`); English pages never request them.

## Arabic and Japanese files

Both come from the Fontsource packages on npm, copied unmodified:

- `@fontsource/ibm-plex-sans-arabic` 5.3.0, the `arabic` subset, `woff2` only.
- `@fontsource-variable/noto-sans-jp` 5.3.1: every `wght-normal.woff2` file in
  `noto-sans-jp/files/`, and the package's own `wght.css`, which declares them
  all under the family `Noto Sans JP Variable`.

Noto Sans JP is split into 120 character slices by unicode range, so a Japanese
page downloads only the slices it uses, a few hundred kilobytes at most. To
update either face, fetch the new package with `npm pack`, replace the files
and `wght.css` together, and change the version here.
