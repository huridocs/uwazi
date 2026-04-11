import React from 'react';
import { configureActions } from 'storybook/actions';
import { addons } from 'storybook/preview-api';
import '../app/react/App/styles/tailwind.css';
import { checkContrast, parseColorToHex } from '../app/shared/utils/contrast.ts';
import {
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
          const label = button.textContent?.trim() || button.getAttribute('aria-label') || `Button ${index + 1}`;
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

    function StorybookA11yFrame() {
      const rootRef = React.useRef(null);

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
      }, [context.args, context.id, mode, preset]);

      return React.createElement(
        'div',
        { ref: rootRef, id: 'tw-container', className: themeFrame.className, 'data-theme-custom': true, style: themeFrame.style },
        React.createElement(Story)
      );
    }

    return React.createElement(StorybookA11yFrame);
  },
];

export const tags = ['autodocs'];
