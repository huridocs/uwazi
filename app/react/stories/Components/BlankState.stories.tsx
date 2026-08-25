import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { BlankState } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';

const meta: Meta<typeof BlankState> = {
  title: 'Components/UI/BlankState',
  component: BlankState,
};

type Story = StoryObj<typeof BlankState>;

const Basic: Story = {
  render: () => (
    <div className="tw-content">
      <BlankState
        icon={
          <MagnifyingGlassIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />
        }
        title={<Translate>No text match</Translate>}
        description={
          <Translate translationKey="No text match description">
            No text match description
          </Translate>
        }
      />
    </div>
  ),
};

export { Basic };
export default meta;
