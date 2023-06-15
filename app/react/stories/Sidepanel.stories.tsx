import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Sidepanel } from 'V2/Components/UI';
import { SidePanelProps } from 'app/V2/Components/UI/Sidepanel';
import { GeneratedContent } from './helpers/GeneratedContent';

const meta: Meta<typeof Sidepanel> = {
  title: 'Components/Sidepanel',
  component: Sidepanel,
};

const SidePanelContainer = (args: SidePanelProps) => {
  const [showSidepanel, setShowSidepanel] = useState(false);

  return (
    <Provider store={createStore()}>
      <div className="tw-content">
        <div>
          <main>
            <h1 className="mb-2 text-xl">This a content title</h1>

            <h2 className="mb-1 text-lg">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </h2>

            <p className="mb-1">
              Fusce id mi eu mauris bibendum dignissim nec in sem. Sed ultrices varius mauris quis
              placerat. Donec imperdiet sodales diam sed imperdiet. Aenean a nisl venenatis lectus
              mattis pellentesque. Duis fermentum ante a ultricies feugiat. Proin dapibus luctus
              purus id viverra. Aenean a aliquet nibh. Aenean facilisis justo quis sem auctor, nec
              mollis tortor placerat. Cras eget enim mollis, mollis risus gravida, pharetra risus.
              Mauris dapibus malesuada mi, quis ornare felis imperdiet eget. Donec sed quam non
              dolor sodales hendrerit. Aenean suscipit, velit sed laoreet cursus, ante odio
              tristique lectus, a porta eros felis eu sem. Curabitur eu gravida dolor. Ut iaculis
              lacus vitae libero viverra interdum. Phasellus ac est consectetur, malesuada nisl nec,
              blandit lorem.
            </p>

            <p className="mb-1">
              Fusce id mi eu mauris bibendum dignissim nec in sem. Sed ultrices varius mauris quis
              placerat. Donec imperdiet sodales diam sed imperdiet. Aenean a nisl venenatis lectus
              mattis pellentesque. Duis fermentum ante a ultricies feugiat.&nbsp;
              <a
                href="http://www.duckduckgo.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-600 underline"
              >
                Proin dapibus luctus purus id viverra.
              </a>
              &nbsp;Aenean a aliquet nibh. Aenean facilisis justo quis sem auctor, nec mollis tortor
              placerat. Cras eget enim mollis, mollis risus gravida, pharetra risus. Mauris dapibus
              malesuada mi, quis ornare felis imperdiet eget. Donec sed quam non dolor sodales
              hendrerit. Aenean suscipit, velit sed laoreet cursus, ante odio tristique lectus, a
              porta eros felis eu sem. Curabitur eu gravida dolor. Ut iaculis lacus vitae libero
              viverra interdum. Phasellus ac est consectetur, malesuada nisl nec, blandit lorem.
            </p>

            <hr className="mb-2" />

            <button
              type="button"
              className="p-1 text-white rounded border-2 border-primary-400 bg-primary-400"
              onClick={() => setShowSidepanel(!showSidepanel)}
            >
              Open/Close sidepanel
            </button>
          </main>
          <Sidepanel
            isOpen={showSidepanel}
            withOverlay={args.withOverlay}
            title={args.title}
            closeSidepanelFunction={() => setShowSidepanel(false)}
            size={args.size}
          >
            <GeneratedContent />
          </Sidepanel>
        </div>
      </div>
    </Provider>
  );
};

type Story = StoryObj<typeof Sidepanel>;

const Primary: Story = {
  render: args => (
    <SidePanelContainer
      withOverlay={args.withOverlay}
      title={args.title}
      size={args.size}
      closeSidepanelFunction={action('closeSidePanel')}
    >
      {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <></>
      }
    </SidePanelContainer>
  ),
};

const Basic: Story = {
  ...Primary,
  args: { withOverlay: false, title: 'My sidepanel', size: 'medium' },
};

export { Basic };

export default meta;
