import React from 'react';
import preview from '#storybook/preview';
import { fn } from 'storybook/test';
import { action } from 'storybook/actions';
import { CookieConsentBanner } from '#V2/Components/UI/CookieConsentBanner.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';

const meta = preview.meta({
  title: 'Components/CookieConsentBanner',
  component: CookieConsentBanner,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onAcceptAll: fn(),
    onEssentialOnly: fn(),
    onRejectAll: fn(),
  },
});

const PagePreview = ({
  onAcceptAll,
  onEssentialOnly,
  onRejectAll,
  legacyChrome = false,
}: {
  onAcceptAll: () => void;
  onEssentialOnly: () => void;
  onRejectAll: () => void;
  legacyChrome?: boolean;
}) => (
  <ThemeProvider legacyChrome={legacyChrome} className="min-h-screen">
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Library</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
        Example page content. The cookie banner floats at the bottom right.
      </p>
    </main>
    <div className="fixed bottom-4 right-4 left-auto z-50 flex w-fit justify-end">
      <CookieConsentBanner
        onAcceptAll={onAcceptAll}
        onEssentialOnly={onEssentialOnly}
        onRejectAll={onRejectAll}
      />
    </div>
  </ThemeProvider>
);

const Default = meta.story({
  render: args => (
    <PagePreview
      onAcceptAll={args.onAcceptAll ?? action('accept-all')}
      onEssentialOnly={args.onEssentialOnly ?? action('essential-only')}
      onRejectAll={args.onRejectAll ?? action('reject-all')}
    />
  ),
});

const LegacyTheme = meta.story({
  render: args => (
    <PagePreview
      legacyChrome
      onAcceptAll={args.onAcceptAll ?? action('accept-all')}
      onEssentialOnly={args.onEssentialOnly ?? action('essential-only')}
      onRejectAll={args.onRejectAll ?? action('reject-all')}
    />
  ),
});

export { Default, LegacyTheme };
