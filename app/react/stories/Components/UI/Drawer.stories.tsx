import React, { useId, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';
import { Drawer, type DrawerMotion, type DrawerScope } from '#V2/Components/UI/Drawer.js';
import { Button } from '#V2/Components/UI/Button.js';

const meta: Meta<typeof Drawer> = {
  title: 'Components/UI/Drawer',
  component: Drawer,
};

type Story = StoryObj<typeof Drawer>;

type DrawerDemoProps = {
  scope?: DrawerScope;
  motion?: DrawerMotion;
  defaultOpen?: boolean;
};

const DrawerDemo = ({ scope = 'fixed', motion, defaultOpen = false }: DrawerDemoProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const titleId = useId();
  const onClose = () => {
    setOpen(false);
    action('drawer-close')();
  };

  const drawer = (
    <Drawer
      open={open}
      onClose={onClose}
      scope={scope}
      motion={motion}
      id="demo-drawer-dialog"
      labelledBy={titleId}
      wrapperTestId="drawer-wrapper"
      overlayTestId="drawer-overlay"
      header={
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <h1 id={titleId} className="text-base font-bold text-ink">
            Drawer title
          </h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-testid="drawer-close-button"
            className="ms-auto flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-warm"
          >
            ×
          </button>
        </div>
      }
      footer={
        <div className="shrink-0 border-t border-border p-3">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <p className="p-4 text-sm text-ink-secondary" data-testid="drawer-body">
        Drawer body content for layout and interaction tests.
      </p>
    </Drawer>
  );

  if (scope === 'absolute') {
    return (
      <div className="tw-content relative h-112 overflow-hidden rounded-lg border border-border bg-warm">
        <div className="p-4">
          <Button data-testid="open-drawer" onClick={() => setOpen(true)}>
            Open drawer
          </Button>
        </div>
        {drawer}
      </div>
    );
  }

  return (
    <div className="tw-content min-h-80 p-4">
      <Button data-testid="open-drawer" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      {drawer}
    </div>
  );
};

const Playground: Story = {
  render: () => <DrawerDemo />,
};

const Open: Story = {
  render: () => <DrawerDemo defaultOpen />,
};

const Absolute: Story = {
  render: () => <DrawerDemo scope="absolute" defaultOpen />,
};

export default meta;
export { Playground, Open, Absolute };
