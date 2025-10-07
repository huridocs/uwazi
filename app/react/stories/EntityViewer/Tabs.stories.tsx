import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { DocumentTextIcon, CodeBracketIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';
// Keep Buttons import only if you need the ButtonsOnly story later.
import { Tabs } from 'app/V2/Routes/Entity/Components/Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/EntityViewer/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onTabSelected: { action: 'tab selected' },
  },
};

type Story = StoryObj<typeof Tabs>;

const InteractiveExample: Story = {
  // Wrap with a component so hooks are valid
  render: _args => {
    const Demo: React.FC = () => {
      const [activeTab, setActiveTab] = useState('basic');

      return (
        <div className="tw-content">
          <Tabs
            tabs={[
              {
                id: 'basic',
                label: 'Basic',
                controls: 'panel-basic',
                content: <div className="p-4">Basic content</div>,
                icon: <RectangleGroupIcon className="w-5 h-5" />,
              },
              {
                id: 'md',
                label: 'Markdown',
                controls: 'panel-md',
                content: <div className="p-4">Markdown content</div>,
                count: 2,
                icon: <DocumentTextIcon className="w-5 h-5" />,
              },
              {
                id: 'js',
                label: 'Javascript',
                controls: 'panel-js',
                content: <div className="p-4">Javascript content</div>,
                icon: <CodeBracketIcon className="w-5 h-5" />,
              },
            ]}
            defaultActiveId={activeTab}
            onTabSelected={id => setActiveTab(id)}
          />
        </div>
      );
    };

    return <Demo />;
  },
};

export { InteractiveExample };

export default meta;
