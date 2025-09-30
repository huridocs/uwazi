import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PaneLayout } from 'V2/Components/Layouts/PaneLayout';

const meta: Meta<typeof PaneLayout> = {
  title: 'Layouts/PaneLayout',
  component: PaneLayout,
};

type Story = StoryObj<typeof PaneLayout>;

const Component = ({
  localStorageKey,
  defaultWidthsPercents,
}: {
  localStorageKey?: string;
  defaultWidthsPercents?: number[];
}) => (
  <PaneLayout localStorageKey={localStorageKey} defaultWidthsPercents={defaultWidthsPercents}>
    <PaneLayout.Pane key="pane-1">
      <div>
        <p>
          Aenean ac purus nulla. Fusce non consequat odio. Duis non sagittis mi. In at magna a lorem
          porta porta. Mauris a tincidunt enim, eget venenatis est. Aenean euismod ex sem.
          Suspendisse aliquam ligula quis leo luctus viverra vel ut ipsum. Aliquam a ultrices arcu,
          vitae hendrerit arcu. Sed a urna ac nisi ultrices pretium. Vivamus ante lacus, elementum
          sit amet pellentesque vitae, efficitur vitae purus. Vivamus pellentesque elit blandit,
          facilisis sapien vitae, tristique nisl.
        </p>
      </div>
    </PaneLayout.Pane>
    <PaneLayout.Pane key="pane-2">
      <div className="min-w-96 overflow-x-auto">
        <h2 className="text-lg font-semibold">This pane children has a min width</h2>
        <p>
          Nunc ullamcorper metus risus, vitae semper augue laoreet vitae. Morbi commodo risus id
          interdum tempus. Sed condimentum lectus lacus, a imperdiet augue feugiat ut. Nam ac
          feugiat purus. Nullam dictum ornare blandit. Integer sed pulvinar justo, quis luctus erat.
          Etiam id metus sed sem aliquet hendrerit ac quis turpis. Duis posuere nunc elementum sem
          finibus ultrices. Nam sed libero aliquet mauris vulputate laoreet ac id neque.
        </p>
      </div>
    </PaneLayout.Pane>
    <PaneLayout.Pane key="pane-3">
      <div>
        <p>
          Sed velit eros, pretium id imperdiet eget, tristique vel odio. Vestibulum ante ipsum
          primis in faucibus orci luctus et ultrices posuere cubilia curae; Quisque non mollis mi.
          Proin pharetra, tellus quis ultrices aliquet, magna nibh accumsan neque, id viverra ex
          neque a libero. Aliquam auctor a ante id pretium. Cras lobortis, metus eget pellentesque
          feugiat, purus purus porttitor ligula, nec euismod orci massa eu sem. Phasellus tincidunt
          interdum lacinia. Praesent ac ornare nisi. Nulla ornare quis felis vel auctor. Donec
          bibendum odio urna, in rutrum justo lacinia a. Mauris accumsan commodo metus. Suspendisse
          eu venenatis massa. Vivamus lorem metus, sodales ac porttitor eget, dignissim sit amet
          sem. Sed nec nisi at felis iaculis venenatis in vitae magna.
        </p>
        <p>
          Pellentesque justo purus, porta a interdum vel, posuere sit amet nisl. Aenean pellentesque
          semper ullamcorper. Etiam eget nisi in sapien convallis dictum ac vel justo. Donec
          lobortis lectus odio, at euismod augue tincidunt ac. Quisque et tempor justo. Mauris
          ultrices massa ullamcorper est porta iaculis vel quis metus. Pellentesque nibh sapien,
          maximus vitae porttitor eu, efficitur quis arcu. Praesent tristique ac tortor at rhoncus.
          Quisque quis velit porta, malesuada velit ut, suscipit nibh. Aenean sollicitudin sapien
          laoreet lectus ultricies, eu porttitor eros condimentum. Integer eu aliquet mauris.
          Vivamus interdum laoreet felis in pulvinar. Duis at risus a mi luctus luctus. Vivamus
          malesuada tellus erat, gravida laoreet erat finibus sit amet. Nulla tristique vitae augue
          non sagittis.
        </p>
        <p>
          Sed velit eros, pretium id imperdiet eget, tristique vel odio. Vestibulum ante ipsum
          primis in faucibus orci luctus et ultrices posuere cubilia curae; Quisque non mollis mi.
          Proin pharetra, tellus quis ultrices aliquet, magna nibh accumsan neque, id viverra ex
          neque a libero. Aliquam auctor a ante id pretium. Cras lobortis, metus eget pellentesque
          feugiat, purus purus porttitor ligula, nec euismod orci massa eu sem. Phasellus tincidunt
          interdum lacinia. Praesent ac ornare nisi. Nulla ornare quis felis vel auctor. Donec
          bibendum odio urna, in rutrum justo lacinia a. Mauris accumsan commodo metus. Suspendisse
          eu venenatis massa. Vivamus lorem metus, sodales ac porttitor eget, dignissim sit amet
          sem. Sed nec nisi at felis iaculis venenatis in vitae magna.
        </p>
        <p>
          Pellentesque justo purus, porta a interdum vel, posuere sit amet nisl. Aenean pellentesque
          semper ullamcorper. Etiam eget nisi in sapien convallis dictum ac vel justo. Donec
          lobortis lectus odio, at euismod augue tincidunt ac. Quisque et tempor justo. Mauris
          ultrices massa ullamcorper est porta iaculis vel quis metus. Pellentesque nibh sapien,
          maximus vitae porttitor eu, efficitur quis arcu. Praesent tristique ac tortor at rhoncus.
          Quisque quis velit porta, malesuada velit ut, suscipit nibh. Aenean sollicitudin sapien
          laoreet lectus ultricies, eu porttitor eros condimentum. Integer eu aliquet mauris.
          Vivamus interdum laoreet felis in pulvinar. Duis at risus a mi luctus luctus. Vivamus
          malesuada tellus erat, gravida laoreet erat finibus sit amet. Nulla tristique vitae augue
          non sagittis.
        </p>
      </div>
    </PaneLayout.Pane>
  </PaneLayout>
);

const Primary: Story = {
  render: args => (
    <div className="tw-content" style={{ height: '768px', maxHeight: '768px' }}>
      <div className="flex flex-col gap-4 h-full">
        <div className="w-full bg-primary-700">
          <ul className="text-white list-none px-1 py-2 flex flex-row gap-4">
            <li>Menu item 1</li>
            <li>Menu item 2</li>
          </ul>
        </div>

        <div className="w-full flex-1 min-h-0">
          <Component
            localStorageKey={args.localStorageKey}
            defaultWidthsPercents={args.defaultWidthsPercents}
          />
        </div>

        <footer className="w-full border-t-2">General app footer</footer>
      </div>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    localStorageKey: undefined,
    defaultWidthsPercents: undefined,
  },
};

export { Basic };

export default meta;
