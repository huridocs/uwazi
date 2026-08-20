import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import { action } from 'storybook/actions';
import { CookieConsentBanner } from '#V2/Components/UI/CookieConsentBanner.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';

const meta: Meta<typeof CookieConsentBanner> = {
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
};

type Story = StoryObj<typeof CookieConsentBanner>;

const floatStyle = {
  position: 'fixed' as const,
  bottom: '1rem',
  insetInlineEnd: '1rem',
  left: 'auto',
  width: 'fit-content',
  zIndex: 50,
  maxWidth: 'calc(100vw - 2rem)',
};

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
    <div style={floatStyle}>
      <CookieConsentBanner
        onAcceptAll={onAcceptAll}
        onEssentialOnly={onEssentialOnly}
        onRejectAll={onRejectAll}
      />
    </div>
  </ThemeProvider>
);

const Default: Story = {
  render: args => (
    <PagePreview
      onAcceptAll={args.onAcceptAll ?? action('accept-all')}
      onEssentialOnly={args.onEssentialOnly ?? action('essential-only')}
      onRejectAll={args.onRejectAll ?? action('reject-all')}
    />
  ),
};

const LegacyTheme: Story = {
  render: args => (
    <PagePreview
      legacyChrome
      onAcceptAll={args.onAcceptAll ?? action('accept-all')}
      onEssentialOnly={args.onEssentialOnly ?? action('essential-only')}
      onRejectAll={args.onRejectAll ?? action('reject-all')}
    />
  ),
};

export { Default, LegacyTheme };
export default meta;
