# V2 theming architecture

This document describes how tenant-customizable colors flow from settings to CSS custom properties on the page, and how **presets**, **resolved variables**, **roles**, and **component tokens** relate. For class-to-token migration, see [theme-migration-guide.md](./theme-migration-guide.md).

Primary implementation paths:

- `app/react/V2/theme/tokens.ts` — semantic keys, preset tables, `ResolvedThemeVars` shape
- `app/react/V2/theme/themes.ts` — `appliedTheme`, `getPresetId`, compatibility aliases
- `app/react/V2/theme/themeRoles.ts` — `ThemeRoles`, `getThemeRoleVars`
- `app/react/V2/theme/themeScopedVars.ts` — `getScopedThemeVars` (final merge)
- `app/react/V2/theme/ThemeProvider.tsx` — React injection
- `app/react/V2/theme/roleTokens.ts` — string constants for component-level CSS variable names
- `app/shared/utils/contrast.js` — accessible foreground / color pairs used when deriving UI colors

## End-to-end data flow

```mermaid
flowchart TB
  subgraph storage["Persisted settings"]
    API["settings API (themeVars, themeCustomization, …)"]
    TV["themeVars map: __preset, light:--color-theme-…, legacy flat keys"]
  end

  subgraph resolve["Resolution (themes.ts)"]
    GC["getPresetId(themeVars, customizationOn) → default | legacy | custom"]
    AT["appliedTheme(themeVars, mode, resolutionEnabled): clone PRESET_DEFINITIONS[preset].modes[mode], override SEMANTIC_VAR_KEYS from storage"]
    RV["ResolvedThemeVars: full CSS key → value"]
  end

  subgraph roles["Semantic roles (themeRoles.ts)"]
    TR["getThemeRoles(presetId, resolved)"]
    TRV["getThemeRoleVars(roles) → --color-theme-surface-*, --color-theme-action-*, …"]
  end

  subgraph contrast["Contrast (#shared/utils/contrast.js)"]
    GA["getAccessibleForegroundOnBackground, getAccessibleColorPair, mixHex"]
    GA --> TR
    GA --> TB["themeBaseVars (emphasis solid)"]
    GA --> BT["button contexts"]
    GA --> SF["surfaceThemeVars (headers, banners)"]
  end

  subgraph scoped["Flat CSS map (themeScopedVars.ts)"]
    MERGE["getScopedThemeVars: merge resolved → role vars → compatibility → derived chrome → action → buttons → controls → surface → cards → banners"]
    STYLE["Record used as React inline style custom properties"]
  end

  subgraph ui["ThemeProvider"]
    TP["reads settingsAtom, mode, legacyChrome"]
    TP --> AT
    TP --> GC
    DIV["wrapper div: style + data-theme-mode + data-theme-custom"]
    MERGE --> DIV
  end

  API --> TV
  TV --> AT
  GC --> AT
  AT --> RV
  RV --> TR
  TR --> TRV
  RV --> MERGE
  TRV --> MERGE
```



## Presets, editable vars, roles, and tokens

```mermaid
flowchart LR
  subgraph presets["ThemePresetId"]
    P1["default"]
    P2["legacy"]
    P3["custom (__preset)"]
  end

  subgraph editable["EditableThemeVars"]
    SVK["SEMANTIC_VAR_KEYS: 11 user-facing --color-theme-* keys"]
  end

  subgraph derived["ResolvedThemeVars"]
    MORE["Preset tables per mode + derived keys: tints, feedback, highlights, shadows, …"]
  end

  subgraph roles2["ThemeRoles"]
    R["Structured object: surface, text, border, action, feedback, chrome"]
  end

  subgraph rolecss["Role-level CSS variables"]
    RC["getThemeRoleVars output"]
  end

  subgraph component["roleTokens.ts"]
    RT["Constants: --color-theme-button-*, card/control tokens, …"]
  end

  presets --> derived
  editable -->|"appliedTheme overrides"| derived
  derived --> roles2
  roles2 --> rolecss
  rolecss --> OUT["Final property bag on ThemeProvider div"]
  derived -->|"component var builders"| OUT
  RT -->|"names reference"| OUT
```



## ThemeProvider and flags

```mermaid
flowchart TD
  A["settings.themeCustomization?"] -->|no| L["presetId tends to legacy path; legacy preset tables"]
  A -->|yes| B["themeVars + mode"]
  B --> C["getPresetId"]
  B --> D["appliedTheme → ResolvedThemeVars"]
  C --> E["getScopedThemeVars(presetId, resolved)"]
  D --> E
  E --> F["style on wrapper div"]

  G["legacyChrome prop"] -->|"forces legacy preset"| C
  H["resolutionEnabled = customization && !legacyChrome"] --> D
```



## Merge order

`getScopedThemeVars` builds one object by spreading layers in a fixed order. Later layers can supply or override keys set by earlier ones. The intended sequence is:

1. `resolved` (full palette for the active mode)
2. `getThemeRoleVars(roles)`
3. `toCompatibilityVars(resolved)` (short and legacy alias names)
4. `getDerivedThemeVars` (brand chrome surface variables from roles)
5. `getActionThemeVars` (emphasis solid pair from contrast)
6. `getButtonThemeVars`
7. `getControlThemeVars`
8. `getSurfaceThemeVars`
9. `getCardThemeVars`
10. `getBannerThemeVars`

## Which CSS variable should I use?

Use the **left column** for new V2 UI inside `ThemeProvider`. Variables from `getThemeRoleVars` are semantic (surface, action, feedback, chrome). **Resolved** names are the canonical storage keys from presets and customization. **Compatibility** short names exist for older CSS; prefer not to introduce them in new components. **Component tokens** (`roleTokens.ts`) are for specific widgets (buttons, inputs, card headers) and are filled in late merge steps, so they already encode contrast and preset quirks.


| UI intent                               | Preferred variable                                         | Same idea (resolved / compat)                       | Notes                                             |
| --------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| App / page canvas                       | `--color-theme-surface-page`                               | `--color-theme-bg-primary`, `--bg-primary`          | Role maps 1:1 from `bg-primary`.                  |
| Raised surface (cards, panels)          | `--color-theme-surface-raised`                             | `--color-theme-bg-surface`, `--bg-surface`          |                                                   |
| Warm band                               | `--color-theme-surface-warm`                               | `--color-theme-bg-warm`, `--bg-warm`                |                                                   |
| Muted blocks                            | `--color-theme-surface-muted`                              | `--color-theme-bg-muted`, `--bg-muted`              |                                                   |
| Overlay / scrim                         | `--color-theme-surface-overlay`                            | `--color-theme-bg-overlay`, `--bg-overlay`          |                                                   |
| Selected background                     | `--color-theme-surface-selected`                           | `--color-theme-bg-selected`, `--bg-selected`        |                                                   |
| Primary body text                       | `--color-theme-text-primary`                               | `--text-primary`                                    | Role `text.primary` equals resolved.              |
| Secondary / tertiary / muted text       | `--color-theme-text-secondary` (etc.)                      | `--text-secondary`, …                               |                                                   |
| Text safe on primary accent             | `--color-theme-text-on-solid`                              | —                                                   | Computed for contrast on action primary.          |
| Default border                          | `--color-theme-border-default`                             | `--color-theme-border-primary`, `--border-primary`  |                                                   |
| Interactive / focus border (controls)   | `--color-theme-control-border-focus` (`roleTokens`)        | —                                                   | Control vars use `roles.border.focus`.            |
| Accent / brand primary                  | `--color-theme-action-primary`                             | `--color-theme-accent-primary`, `--accent-primary`  | Hover: `--color-theme-action-primary-hover`.      |
| Primary-on-accent (e.g. link on brand)  | `--color-theme-action-primary-fg`                          | —                                                   |                                                   |
| Secondary control surfaces              | `--color-theme-action-secondary-`*                         | —                                                   |                                                   |
| Info / success / warning / danger       | `--color-theme-feedback-*`                                 | `--color-theme-success`, `--danger`, …              | Danger aligns with emphasis accent in roles.      |
| Top chrome / app bar                    | `--color-theme-chrome-app-bar` (+ hover/active/fg)         | `--color-theme-brand-surface` family (`roleTokens`) | Derived chrome vars alias bar colors.             |
| Solid destructive emphasis              | `--color-theme-accent-emphasis-solid`                      | —                                                   | Pair with `-foreground`; from contrast on danger. |
| Primary / status / embedded **buttons** | `--color-theme-button-`* via `roleTokens`                  | —                                                   | Do not hand-roll fills from accent alone.         |
| Inputs, selects                         | `--color-theme-control-*` via `roleTokens`                 | —                                                   |                                                   |
| Card headers, banners                   | `CARD_*`, `INFO_BANNER_*`, `WARNING_*`, `SECTION_HEADER_*` | —                                                   | See `surfaceThemeVars.ts`.                        |


When in doubt: **role variable for layout and semantics**, `**roleTokens` constant for a specific component variant**, **resolved keys** when persisting or editing the 11 customizable semantic entries in settings.