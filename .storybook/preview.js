import React from 'react';
import { configureActions } from 'storybook/actions';
import { addons } from 'storybook/preview-api';
import { Provider as ReduxProvider } from 'react-redux';
import { createStore, Provider as JotaiProvider } from 'jotai';
import '../app/react/App/styles/tailwind.css';
import { LEGACY_createStore as createReduxStore } from '../app/react/V2/testing/index.js';
import {
  localeAtom,
  settingsAtom,
  themeModeAtom,
  translationsAtom,
  userAtom,
} from '../app/react/V2/atoms/index.js';
import { checkContrast, parseColorToHex } from '../app/shared/utils/contrast.ts';
import {
  buildStorybookThemeVars,
  getStorybookContrastChecks,
  getStorybookThemeFrame,
  normalizeStorybookThemeMode,
  normalizeStorybookThemePreset,
} from '../app/react/stories/storybookTheme.ts';
import { STORYBOOK_A11Y_EVENT } from './a11yConstants.js';

if (typeof window !== 'undefined') {
  window.__featureFlags__ = {
    ...(window.__featureFlags__ || {}),
    themeCustomization: true,
  };
}

configureActions({
  depth: 100,
  limit: 20,
});

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const globalTypes = {
  uwaziThemePreset: {
    name: 'Theme',
    defaultValue: 'default',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'default', title: 'Uwazi Design' },
        { value: 'legacy', title: 'Legacy Uwazi' },
      ],
    },
  },
  uwaziThemeMode: {
    name: 'Mode',
    defaultValue: 'light',
    toolbar: {
      icon: 'mirror',
      items: [
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' },
      ],
    },
  },
};

export const decorators = [
  (Story, context) => {
    const preset = normalizeStorybookThemePreset(context.globals.uwaziThemePreset);
    const mode = normalizeStorybookThemeMode(context.globals.uwaziThemeMode);
    const themeFrame = getStorybookThemeFrame(preset, mode);

    const emitChecks = root => {
      const includeThemeChecks =
        context.title === 'Components/UI/Header' ||
        context.title === 'Settings/ThemePicker' ||
        Boolean(root?.querySelector('[data-storybook-theme-checks]'));
      const themeChecks = includeThemeChecks ? getStorybookContrastChecks(preset, mode) : [];
      if (!root) {
        addons.getChannel().emit(STORYBOOK_A11Y_EVENT, { preset, mode, checks: themeChecks });
        return;
      }

      const buttonChecks = Array.from(root.querySelectorAll('button'))
        .filter(button => button.textContent?.trim())
        .slice(0, 8)
        .flatMap((button, index) => {
          const styles = window.getComputedStyle(button);
          const background = parseColorToHex(styles.backgroundColor);
          const color = parseColorToHex(styles.color);
          const label =
            button.textContent?.trim() ||
            button.getAttribute('aria-label') ||
            `Button ${index + 1}`;
          const checks = [];

          if (background && color) {
            checks.push({
              id: `button-text-${index}`,
              label: `${label} text`,
              ...checkContrast(background, color),
            });
          }

          return checks;
        });

      addons.getChannel().emit(STORYBOOK_A11Y_EVENT, {
        preset,
        mode,
        checks: [...themeChecks, ...buttonChecks],
      });
    };

    const StorybookA11yFrame = () => {
      const rootRef = React.useRef(null);
      const reduxStoreRef = React.useRef(createReduxStore());
      const jotaiStore = React.useMemo(() => {
        const store = createStore();
        store.set(userAtom, {
          _id: 'storybook-user',
          username: 'storybook',
          role: 'admin',
          email: 'storybook@uwazi.io',
        });
        store.set(settingsAtom, {
          site_name: 'Uwazi',
          private: false,
          defaultLibraryView: 'cards',
          links: [{ _id: '1', title: 'Library', url: '/library', type: 'link' }],
          languages: [{ key: 'en', label: 'English', default: true }],
          themeCustomization: true,
          themeVars: buildStorybookThemeVars(preset),
        });
        store.set(themeModeAtom, mode);
        store.set(localeAtom, 'en');
        store.set(translationsAtom, []);
        return store;
      }, []);

      React.useEffect(() => {
        const root = rootRef.current;
        if (!root) {
          emitChecks(null);
          return undefined;
        }

        let frame = requestAnimationFrame(() => emitChecks(root));
        const observer = new MutationObserver(() => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => emitChecks(root));
        });

        observer.observe(root, {
          attributes: true,
          childList: true,
          subtree: true,
          characterData: true,
        });

        return () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
        };
      }, []);

      return React.createElement(
        ReduxProvider,
        { store: reduxStoreRef.current },
        React.createElement(
          JotaiProvider,
          { store: jotaiStore },
          React.createElement(
            'div',
            {
              ref: rootRef,
              id: 'tw-container',
              className: themeFrame.className,
              'data-theme-custom': true,
              dir: 'ltr',
              style: themeFrame.style,
            },
            React.createElement(Story)
          )
        )
      );
    };

    return React.createElement(StorybookA11yFrame);
  },
];

export const tags = ['autodocs'];
