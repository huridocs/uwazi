# Theme and brand alignment

Specs are taken from the Uwazi design repo (`uwazi-design/docs/`). This doc maps them into the app and lists what comes from each source.

## Sources

| Doc | Use in implementation |
|-----|------------------------|
| **brand-colors.md** | Six brand colors (Seal, Carbon, Ink, Vellum, Parchment, Paper), semantic variable mapping, accent usage, design decisions. |
| **design-system.md** | Two light theme variants (Value 1 / Value 2), hardcoded colors, typography (Inter, Roboto Mono), spacing (navbar 64px, sidebar 250px, etc.), shadows, borders. |
| **components.md** | Component use of semantic vars (navbar, sidebar, buttons, cards, modals, dropzone, table, breadcrumb, badges); rebrand overrides (#FCFAF8, #E0D9C8A3). |
| **screens.md** | Screen layout and fill ($bg-primary); rebrand usage in Import CSV screens. |
| **uwazi-navigation.md** | Settings layout (sidebar 250px), routes; no new color tokens. |

## Brand palette (brand-colors.md)

| Id        | Name     | Hex       | Role |
|-----------|----------|-----------|------|
| seal      | Seal     | `#E8432A` | Marks, alerts, actions (e.g. danger) |
| carbon    | Carbon   | `#00B4F0` | Links, data, secondary accent |
| ink       | Ink      | `#1A1A1A` | Text, headers, primary actions |
| vellum    | Vellum   | `#F5EED7` | Nav hover, muted backgrounds |
| parchment | Parchment| `#F5F0E8` | Page background |
| paper     | Paper    | `#FFFFFF` | Cards, sidebar, modals |

## Semantic variable mapping (ThemeProvider / themePalette)

When theme customization is on, the app sets these CSS custom properties on the theme wrapper:

| CSS variable                  | Label              | Hex       |
|-------------------------------|--------------------|-----------|
| `--color-accent-primary`      | Accent primary     | `#1A1A1A` |
| `--color-accent-secondary`    | Accent secondary   | `#00B4F0` |
| `--color-accent-alert`        | Accent alert       | `#E8432A` |
| `--color-bg-primary`          | Background primary | `#F5F0E8` |
| `--color-bg-surface`     | Background surface | `#FFFFFF` |
| `--color-bg-muted`       | Background muted   | `#F5EED7` |
| `--color-text-primary`   | Text primary     | `#1A1A1A` |
| `--color-text-secondary` | Text secondary   | `#333333` |
| `--color-text-muted`     | Text muted       | `#9A9A9A` |
| `--color-border-primary` | Border primary   | `#E0D9C8` |

The user-chosen **theme color** (Settings → Collection) is stored as hex and applied as `--color-theme` and `--color-theme-foreground` (e.g. header/topbar). Other semantic vars use the brand defaults above.

## Design system variants (design-system.md)

The design-system defines **two light theme values** for the same variables (e.g. `$accent-primary` Value 1 `#5145CD`, Value 2 `#3730A3`). The app currently implements the **rebrand** palette from brand-colors; named palettes (e.g. light variant 1, light variant 2) can be added later.

## Hardcoded colors (design-system.md, components.md)

These are used inline in specs; components can later switch to CSS vars if we expose them:

| Hex         | Usage |
|-------------|--------|
| `#FFFFFF`   | Button text on filled buttons |
| `#1F2A37`   | Secondary button text/icons |
| `#E5E7EB`   | Secondary button border (original); rebrand uses `$border-primary` |
| `#C81E1E`   | Danger/delete button background |
| `#EBE9F7`   | Active sidebar item background (original) |
| `#EEF2FF`   | Selected row highlight, selection action bar |
| `#FCFAF8`   | Rebrand: table header, stats bar, dropzone, file uploaded |
| `#00000066` | Modal overlay |
| `#00000033` | Modal shadow |
| `#0000001A` | Card/dropdown shadow |

## Component usage (components.md)

- **Navbar**: 64px, `$bg-surface`, `$border-primary`; brand wordmark uses `$text-primary`.
- **Sidebar**: 250px, `$bg-surface`, `$border-primary`; active item (rebrand) Ink on Vellum.
- **Buttons**: Primary = `$accent-primary`; Danger = hardcoded red; Secondary = stroke + `#1F2A37`.
- **Cards / Modals**: `$bg-surface`, corners 8 / 12, shadows as above.
- **Dropzone (rebrand)**: Fill `#FCFAF8`, stroke `#D4CDB8A3`.
- **Status badges**: COMPLETED (green), PROCESSING (blue), FAILED (red), PENDING (gray).

## Design decisions (brand-colors.md)

- Ink is primary for UI chrome; Seal and Carbon are used sparingly as semantic accents.
- Sidebar active: Ink text on Vellum background (no color accent).
- Light surfaces use solid hex (e.g. Parchment-derived `#FCFAF8`); borders can use opacity for softness.

## Contrast

- **Neutral contrast** (e.g. topbar text, buttons on theme background): use `getContrastTextColor(backgroundHex)` from `app/shared/utils/contrast.ts`; it returns `#1A1A1A` or `#FFFFFF` by relative luminance.
- **Hue-preserving contrast** (e.g. template labels, badges on colored chips): use the `getTextColor` logic in `app/react/V2/Components/Metadata/TemplateLabel.tsx` so text stays readable but keeps a tint of the background color.

## Future

- Custom logo upload and display in topbar (issue #8741).
- Apply semantic vars to more V2 routes (Settings, entity v2) incrementally.
