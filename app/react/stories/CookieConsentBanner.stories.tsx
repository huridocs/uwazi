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
    onAccept: fn(),
    onReject: fn(),
  },
};

type Story = StoryObj<typeof CookieConsentBanner>;

const PagePreview = ({
  onAccept,
  onReject,
  legacyChrome = false,
}: {
  onAccept: () => void;
  onReject: () => void;
  legacyChrome?: boolean;
}) => (
  <ThemeProvider legacyChrome={legacyChrome} className="min-h-screen">
    <div className="relative min-h-screen bg-primary">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-ink">Library</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          Example page content. The cookie banner stays fixed at the bottom without blocking the full
          viewport.
        </p>
      </main>
      <ThemeProvider className="fixed inset-x-0 bottom-0 z-50">
        <CookieConsentBanner onAccept={onAccept} onReject={onReject} />
      </ThemeProvider>
    </div>
  </ThemeProvider>
);

const Default: Story = {
  render: args => (
    <PagePreview
      onAccept={args.onAccept ?? action('accepted')}
      onReject={args.onReject ?? action('rejected')}
    />
  ),
};

const LegacyTheme: Story = {
  render: args => (
    <PagePreview
      legacyChrome
      onAccept={args.onAccept ?? action('accepted')}
      onReject={args.onReject ?? action('rejected')}
    />
  ),
};

export { Default, LegacyTheme };
export default meta;
