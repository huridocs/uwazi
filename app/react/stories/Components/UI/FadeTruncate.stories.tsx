import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { FadeTruncate } from '#V2/Components/UI/index.js';

const QUOTE =
  'The Inter-American Court of Human Rights, composed of the following judges, delivers the present judgment in the case of Velásquez Rodríguez versus the State of Honduras, submitted by the Inter-American Commission on Human Rights, concerning the detention and subsequent disappearance of Angel Manfredo Velásquez Rodríguez.';

const meta: Meta<typeof FadeTruncate> = {
  title: 'Design System/Shared/FadeTruncate',
  component: FadeTruncate,
  parameters: { layout: 'padded' },
  args: {
    text: QUOTE,
    maxLines: 2,
    className: 'text-xs text-ink-secondary leading-relaxed',
  },
};

type Story = StoryObj<typeof FadeTruncate>;

const panelDecorator = (StoryComponent: () => React.ReactNode) => (
  <div className="tw-content max-w-sm rounded-lg border border-border bg-paper p-3">
    <StoryComponent />
  </div>
);

export const TwoLines: Story = {
  decorators: [panelDecorator],
};

export const Expandable: Story = {
  args: { expandable: true, maxLines: 3 },
  decorators: [panelDecorator],
};

export default meta;
