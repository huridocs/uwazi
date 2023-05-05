import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Sidepanel } from 'V2/Components/UI';

const SidepanelStory = {
  title: 'Components/Sidepanel',
  component: Sidepanel,
};

const SidepanelContent = () => <p>The content of my sidepanel</p>;

const Template: ComponentStory<typeof Sidepanel> = args => {
  const [showSidepanel, setShowSidepanel] = useState(false);

  return (
    <Provider store={createStore()}>
      <div className="tw-content">
        <div>
          <main>
            <h1 className="text-xl mb-2">This a content title</h1>

            <h2 className="text-lg mb-1">
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
              className="border-2 rounded border-primary-400 p-1 bg-primary-400 text-white"
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
          >
            <SidepanelContent />
          </Sidepanel>
        </div>
      </div>
    </Provider>
  );
};

const Basic = Template.bind({});

Basic.args = { withOverlay: false, title: 'My sidepanel' };

export { Basic };

export default SidepanelStory as ComponentMeta<typeof Sidepanel>;
