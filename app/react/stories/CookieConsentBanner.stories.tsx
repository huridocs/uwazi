import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import { action } from 'storybook/actions';
import { CookieConsentBanner } from '#V2/Components/UI/CookieConsentBanner.js';

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
}: {
  onAccept: () => void;
  onReject: () => void;
}) => (
  <div className="tw-content relative min-h-screen bg-primary">
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Library</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
        Example page content. The cookie banner stays fixed at the bottom without blocking the full
        viewport.
      </p>
    </main>
    <CookieConsentBanner onAccept={onAccept} onReject={onReject} />
  </div>
);

const Default: Story = {
  render: args => (
    <PagePreview
      onAccept={args.onAccept ?? action('accepted')}
      onReject={args.onReject ?? action('rejected')}
    />
  ),
};

export { Default };
export default meta;
