import React, { useState } from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { Sidepanel, Button } from '#V2/Components/UI/index.js';
import { SidePanelProps } from '#V2/Components/UI/Sidepanel.js';
import { GeneratedContent } from './helpers/GeneratedContent.js';

const meta = preview.meta({
  title: 'Components/Sidepanel',
  component: Sidepanel,
});

const SidePanelContainer = (args: SidePanelProps) => {
  const [showSidepanel, setShowSidepanel] = useState(false);

  return (
    <div className="tw-content">
      <div>
        <article>
          <h1 className="mb-2 text-xl">This a content title</h1>

          <h2 className="mb-1 text-lg">Lorem ipsum dolor sit amet consectetur adipisicing elit.</h2>

          <p className="mb-1">
            Fusce id mi eu mauris bibendum dignissim nec in sem. Sed ultrices varius mauris quis
            placerat. Donec imperdiet sodales diam sed imperdiet. Aenean a nisl venenatis lectus
            mattis pellentesque. Duis fermentum ante a ultricies feugiat. Proin dapibus luctus purus
            id viverra. Aenean a aliquet nibh. Aenean facilisis justo quis sem auctor, nec mollis
            tortor placerat. Cras eget enim mollis, mollis risus gravida, pharetra risus. Mauris
            dapibus malesuada mi, quis ornare felis imperdiet eget. Donec sed quam non dolor sodales
            hendrerit. Aenean suscipit, velit sed laoreet cursus, ante odio tristique lectus, a
            porta eros felis eu sem. Curabitur eu gravida dolor. Ut iaculis lacus vitae libero
            viverra interdum. Phasellus ac est consectetur, malesuada nisl nec, blandit lorem.
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

          <Button onClick={() => setShowSidepanel(!showSidepanel)}>Open/Close sidepanel</Button>
        </article>
        <Sidepanel
          isOpen={showSidepanel}
          withOverlay={args.withOverlay}
          title={args.title}
          closeSidepanelFunction={() => setShowSidepanel(false)}
          size={args.size}
        >
          <Sidepanel.Body>
            <GeneratedContent />
          </Sidepanel.Body>
          <Sidepanel.Footer>
            <Button onClick={() => setShowSidepanel(false)}>Close</Button>
          </Sidepanel.Footer>
        </Sidepanel>
      </div>
    </div>
  );
};

const Primary = meta.story({
  args: {
    withOverlay: false,
    title: 'My sidepanel',
    size: 'medium',
    children: <GeneratedContent />,
    closeSidepanelFunction: action('closeSidePanel'),
  },
  render: args => (
    <SidePanelContainer
      withOverlay={args.withOverlay}
      title={args.title}
      size={args.size}
      closeSidepanelFunction={action('closeSidePanel')}
    >
      {args.children}
    </SidePanelContainer>
  ),
});

const Basic = storyExtend(Primary, {
  args: { withOverlay: false, title: 'My sidepanel', size: 'medium' },
});

export { Basic };
