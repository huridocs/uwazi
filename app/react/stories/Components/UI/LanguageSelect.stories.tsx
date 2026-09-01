import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Provider, createStore } from 'jotai';
import { isMobileOverrideAtom } from '#V2/atoms/isMobileAtom.js';
import { LanguageSelect } from '#V2/Components/UI/index.js';

const options = [
  { value: 'en', label: 'English', iso6391: 'en' },
  { value: 'es', label: 'Español', iso6391: 'es' },
  { value: 'fr', label: 'Français', iso6391: 'fr' },
] as const;

const meta: Meta<typeof LanguageSelect> = {
  title: 'Design System/Shared/LanguageSelect',
  component: LanguageSelect,
  parameters: { layout: 'centered' },
};

type Story = StoryObj<typeof LanguageSelect>;

const Demo = ({
  appearance,
  isMobile,
}: {
  appearance: 'default' | 'compact';
  isMobile?: boolean;
}) => {
  const [value, setValue] = useState<(typeof options)[number]['value']>('en');
  const [store] = useState(() => {
    const next = createStore();
    if (isMobile !== undefined) {
      next.set(isMobileOverrideAtom, isMobile);
    }
    return next;
  });
  return (
    <Provider store={store}>
      <div className="tw-content">
        <LanguageSelect
          value={value}
          options={options}
          onChange={setValue}
          aria-label="Language"
          appearance={appearance}
        />
      </div>
    </Provider>
  );
};

export const Default: Story = {
  render: () => <Demo appearance="default" isMobile={false} />,
};

export const Compact: Story = {
  render: () => <Demo appearance="compact" isMobile={false} />,
};

export const MobileTrigger: Story = {
  render: () => <Demo appearance="default" isMobile />,
};

export default meta;
