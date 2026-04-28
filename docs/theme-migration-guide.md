# Theme migration quick guide

For how presets, resolved variables, roles, and `ThemeProvider` fit together, see [theming-architecture.md](./theming-architecture.md).

## 1) Fixed classes -> new theme variables


| Fixed class          | Now resolves to                    | Fallback                     |
| -------------------- | ---------------------------------- | ---------------------------- |
| `bg-paper`           | `--color-theme-surface-raised`     | `--color-theme-bg-surface`   |
| `bg-parchment`       | `--color-theme-surface-page`       | `--color-theme-bg-primary`   |
| `bg-warm`            | `--color-theme-surface-warm`       | `--color-theme-bg-warm`      |
| `bg-vellum`          | `--color-theme-surface-muted`      | `--color-theme-bg-muted`     |
| `bg-overlay`         | `--color-theme-surface-overlay`    | `--color-theme-bg-overlay`   |
| `bg-selected`        | `--color-theme-surface-selected`   | `--color-theme-bg-selected`  |
| `bg-ink`             | `--color-theme-action-primary`     | `--color-theme-text-primary` |
| `text-ink`           | `--color-theme-text-primary`       | -                            |
| `text-ink-secondary` | `--color-theme-text-secondary`     | -                            |
| `text-ink-tertiary`  | `--color-theme-text-tertiary`      | -                            |
| `text-ink-muted`     | `--color-theme-text-muted`         | -                            |
| `border-ink`         | `--color-theme-border-interactive` | `--color-theme-text-primary` |
| `border-border`      | `--color-theme-border-primary`     | -                            |
| `border-border-soft` | `--color-theme-border-soft`        | -                            |


## 2) New tokens -> previous Tailwind/legacy semantic equivalents


| New token                         | Previous semantic var | Typical old Tailwind intent       |
| --------------------------------- | --------------------- | --------------------------------- |
| `--color-theme-bg-primary`        | `--bg-primary`        | `bg-white`                        |
| `--color-theme-bg-surface`        | `--bg-surface`        | `bg-white` / panel backgrounds    |
| `--color-theme-bg-muted`          | `--bg-muted`          | `bg-gray-100`                     |
| `--color-theme-bg-warm`           | `--bg-warm`           | `bg-gray-50`                      |
| `--color-theme-text-primary`      | `--text-primary`      | `text-gray-900`                   |
| `--color-theme-text-secondary`    | `--text-secondary`    | `text-gray-700`                   |
| `--color-theme-text-tertiary`     | `--text-tertiary`     | `text-gray-500`                   |
| `--color-theme-text-muted`        | `--text-muted`        | `text-gray-400`                   |
| `--color-theme-border-primary`    | `--border-primary`    | `border-gray-200`                 |
| `--color-theme-border-soft`       | `--border-soft`       | `border-gray-300`                 |
| `--color-theme-accent-primary`    | `--accent-primary`    | `text-primary-700` / brand accent |
| `--color-theme-accent-supporting` | `--accent-supporting` | `text-blue-600`                   |
| `--color-theme-accent-emphasis`   | `--accent-emphasis`   | `text-red-600` (emphasis/action)  |
| `--color-theme-success`           | `--success`           | `text/ bg-green-*`                |
| `--color-theme-warning`           | `--warning`           | `text/ bg-yellow-*`               |
| `--color-theme-danger`            | `--danger`            | `text/ bg-red-*`                  |


## 3) Buttons: new variants -> previous behavior mapping


| New `Button` variant | Uses tokens                                | Previous version correspondence     |
| -------------------- | ------------------------------------------ | ----------------------------------- |
| `primary`            | `--color-theme-button-primary-*`           | `btn btn-primary`                   |
| `secondary`          | `--color-theme-button-secondary-*`         | `btn btn-default` (outline/surface) |
| `danger`             | `--color-theme-button-danger-*`            | `btn btn-danger`                    |
| `ghost`              | `--color-theme-button-ghost-*`             | link/ghost action button            |
| `compact`            | `--color-theme-button-compact-*`           | small neutral utility button        |
| `success`            | `--color-theme-button-success-*`           | success/confirm CTA                 |
| `dangerSecondary`    | `--color-theme-button-danger-secondary-*`  | outlined danger                     |
| `successSecondary`   | `--color-theme-button-success-secondary-*` | outlined success                    |
| `dangerSubtle`       | `--color-theme-button-danger-subtle-*`     | low-emphasis danger                 |
| `successSubtle`      | `--color-theme-button-success-subtle-*`    | low-emphasis success                |


## Branding / modes / custom colors

- Branding is token-based: colors come from `--color-theme-*` roles
- Modes are `light` and `dark`; values are stored per mode (`light:<token>`, `dark:<token>`).
- Presets are `legacy`, `default`, and `custom`.
- `custom` means token overrides on top of a preset.
- Logos/favicons can be preset-driven (`legacy` or `default`) and still work with custom colors.

### Status


| Area                         | Status                  | Notes                                                                                                                                  |
| ---------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Brand palette mapping        | Aligned                 | Ink/Carbon/Seal + Paper/Parchment/Vellum concepts map to the current semantic token system.                                            |
| Surface and border semantics | Aligned                 | Current `surface-*` and `border-*` role tokens preserve the same concerns defined in design docs.                                      |
| Logo assets by mode          | Aligned                 | Theme assets resolve per mode (`siteLogo`, `favicon`) with preset and custom overrides.                                                |
| Wordmark presentation        | Aligned                 | No forced background is applied behind the logo image in the header/site name flow.                                                    |
| Logo click behavior          | Intentionally different | Guide app toggles views on logo click; Uwazi keeps app navigation behavior (logo links to root). This is preserved by design decision. |


