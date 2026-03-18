# Tailwind CSS Theming: Practices and Conventions

## Design tokens with `@theme`

- Use **`@theme`** for design tokens that should generate utility classes and be overridable (e.g. in media queries or variants).
- Use **`@theme inline`** when tokens should reference runtime CSS variables (e.g. from a theme provider) so utilities stay dynamic without rebuilds.

## Namespaces (Tailwind v4)

| Namespace     | Purpose                    |
|---------------|----------------------------|
| `--color-*`   | Colors                     |
| `--font-*`    | Typography                 |
| `--spacing-*` | Layout / spacing           |
| `--text-*`    | Font sizes, line heights   |
| `--breakpoint-*` | Responsive breakpoints  |

## Runtime theming (CSS variables)

- Prefer **CSS variables** for runtime theme switching (no rebuild, works with addons and user preferences).
- Set variables on `:root` or a scoped selector (e.g. `[data-theme-custom]`); keep theme active only when the attribute/class is present.
- Use a **single source** for semantic tokens (e.g. `--color-topbar-background`, `--color-topbar-text`) and derive contrast text in JS or a small util.

## Multi-theme pattern

- Define base tokens in `@theme` (or `@theme inline` if they come from runtime vars).
- For theme switching, apply a class or data attribute to `html`/`body` and override variables in that scope.
- Avoid duplicating full palettes per theme; override only the tokens that change.

## Our usage (V2-wide)

- **ThemeProvider** wraps app content when the feature flag is on and either a named theme (`settings.themeId`) or legacy **themeColor** (hex) is set. It renders a wrapper with `class="tw-content"` and `data-theme-custom`, and sets `--color-theme`, `--color-theme-foreground`, and all semantic vars (from **docs/THEME-AND-BRAND.md**). Named themes (Rebrand, Light, Dark) and optional `themeOverrides` are resolved in code; see `app/react/V2/theme/themes.ts`.
- Theme scope: all V2 UI under that wrapper. In `tailwind.css`, `[data-theme-custom]` overrides `--color-primary-*` from `--color-theme` and styles the header (background/color from theme vars). Prefer semantic tokens in new components (e.g. `var(--color-accent-primary)`, `var(--color-bg-surface)`).
- **Contrast**: Use `getContrastTextColor(backgroundHex)` (from `#shared/utils/contrast`) for neutral black/white text on solid theme-colored backgrounds (e.g. topbar). Use the TemplateLabel-style `getTextColor` (hue-preserving) for labels or badges on colored backgrounds where the text should keep a tint of the background.
- **Theme surfaces**: Any UI that is a theme-colored surface (header, footer, nav bar, etc.) should add the class **`.theme-surface`** on its root. In `app/react/App/scss/elements/_base.scss`, `[data-theme-custom] .theme-surface` overrides global `a`/`button` colors so links and buttons use `--color-theme-foreground` and related vars instead of the legacy primary. This avoids base/Tailwind styles overlapping theme colors in many places.
