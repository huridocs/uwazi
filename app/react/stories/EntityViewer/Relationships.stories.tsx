import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  RelationshipsDocumentStory,
  type RelationshipsDocumentStoryProps,
} from './relationshipsDocumentViews.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const meta: Meta<typeof RelationshipsDocumentStory> = {
  title: 'EntityViewer/RelationshipsDisplay',
  component: RelationshipsDocumentStory,
  args: {
    locale: 'en',
    activeRelationshipId: null,
    onPointClick: fn(),
    onClusterClick: fn(),
  },
  argTypes: {
    onPointClick: { action: 'point-clicked' },
    onClusterClick: { action: 'cluster-clicked' },
    activeRelationshipId: { control: 'text' },
  },
};

type Story = StoryObj<RelationshipsDocumentStoryProps>;

const Primary: Story = {
  render: args => <RelationshipsDocumentStory {...args} />,
};

const Basic: Story = {
  ...Primary,
  args: {
    fileUrl: undefined,
  },
};

const waitForRail = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const documentView = await canvas.findByTestId('document-container', {}, { timeout: 20000 });
  const rail = within(documentView);
  await rail.findByRole('button', { name: '25' }, { timeout: 20000 });
  return rail;
};

const RailInteractions: Story = {
  ...Primary,
  play: async ({ canvasElement, args }) => {
    const rail = await waitForRail(canvasElement);

    await userEvent.click(await rail.findByRole('button', { name: '25' }));
    await expect(args.onClusterClick).toHaveBeenCalledOnce();
    await expect(rail.getByTestId('cluster-subtree')).toBeInTheDocument();

    await userEvent.click(await rail.findByRole('button', { name: 'Person 1' }));
    await expect(args.onPointClick).toHaveBeenCalledOnce();
    await expect(args.onPointClick).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ title: 'Person 1' }),
      })
    );
    await expect(canvasElement.querySelector('div[data-highlight-key]')).not.toBeNull();

    const standaloneMarkers = (await rail.findAllByTestId('rail-marker')).filter(
      element =>
        !element.closest('[data-testid="rail-marker-cluster"]') &&
        element.textContent?.includes('Person 2')
    );
    await userEvent.click(standaloneMarkers[standaloneMarkers.length - 1]);
    await expect(args.onPointClick).toHaveBeenCalledTimes(2);
    await expect(args.onPointClick).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ title: 'Person 2' }),
      })
    );
  },
};

const Panel: Story = {
  render: () => <RelationshipsStoryShell locale="en" />,
  parameters: { layout: 'fullscreen' },
};

const WithPanel: Story = {
  render: () => <RelationshipsStoryShell locale="en" layout="split" />,
  parameters: { layout: 'fullscreen' },
};

export default meta;
export { Basic, RailInteractions, Panel, WithPanel };
