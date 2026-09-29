/**
 * @jest-environment jsdom
 */
import React, { useCallback, useMemo, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { EntityMainTabsProvider } from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';
import { createStubEntityTabsState } from '../../specs/helpers/createStubEntityTabsState.js';
import {
  EntityOverlayProvider,
  useEntityOverlayActions,
  useEntityOverlayTarget,
} from '../../../context/EntityOverlayContext.js';
import { useRevealSidePane } from '../useRevealSidePane.js';
import { EntityOverlay } from '../EntityOverlay.js';

let mockMobile = false;

jest.mock('#V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => mockMobile,
}));

jest.mock('../useOverlayEntity', () => ({
  useOverlayEntity: () => ({
    entity: { title: 'Mexico', sharedId: 'mx', template: 'tmpl', language: 'en' },
    loading: false,
    error: false,
  }),
}));

jest.mock('../EntityOverlayContent', () => ({
  EntityOverlayContent: () => <div>overlay body</div>,
}));

jest.mock('#V2/Routes/Entity/Components/context/RelationshipsQueryProvider', () => ({
  useEnsureResolved: () => () => Promise.resolve(),
}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18NLinkV2: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  t: (_context: string, key: string) => key,
}));

const Harness = ({ layout }: { layout: boolean }) => {
  const { target } = useEntityOverlayTarget();
  const { openEntityOverlayTarget } = useEntityOverlayActions();
  const [requestedPane, setRequestedPane] = useState<{ index: number; id: number }>();
  const showSidePane = useCallback(() => {
    setRequestedPane(current => ({ index: 1, id: (current?.id ?? 0) + 1 }));
  }, []);
  useRevealSidePane(target !== null, showSidePane);
  const tabs = useMemo(
    () => createStubEntityTabsState({ showSidePane, requestedPane }),
    [requestedPane, showSidePane]
  );

  return (
    <TestAtomStoreProvider
      initialValues={[
        [settingsAtom, { features: {} }],
        [templatesAtom, [{ _id: 'tmpl', color: '#111111', name: 'Person' }]],
      ]}
    >
      <EntityMainTabsProvider value={tabs}>
        {layout ? (
          <PaneLayout requestedPane={requestedPane}>
            <PaneLayout.Pane>
              <div>Main</div>
            </PaneLayout.Pane>
            <PaneLayout.Pane>
              <div>Side</div>
            </PaneLayout.Pane>
          </PaneLayout>
        ) : (
          <div className="relative h-64" />
        )}
        <EntityOverlay />
        <button
          type="button"
          onClick={() =>
            openEntityOverlayTarget({ sharedId: 'mx', title: 'Mexico', templateId: 'tmpl' })
          }
        >
          open overlay
        </button>
      </EntityMainTabsProvider>
    </TestAtomStoreProvider>
  );
};

const expectLayers = () => {
  const dialogs = [...document.querySelectorAll('[role="dialog"]')];
  const side = dialogs.find(dialog => dialog.textContent?.includes('Side'));
  const overlay = dialogs.find(dialog => dialog.textContent?.includes('overlay body'));
  expect(dialogs).toHaveLength(2);
  expect(side).toHaveAttribute('data-layer', '0');
  expect(overlay).toHaveAttribute('data-layer', '1');
  expect(overlay).toHaveTextContent('Close all');
  expect(screen.getAllByRole('button', { name: 'Back' })).toHaveLength(2);
};

const expectOnlySide = () => {
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  expect(document.querySelector('[role="dialog"]')).toHaveTextContent('Side');
};

describe('EntityOverlay sheets', () => {
  afterEach(() => {
    mockMobile = false;
    document.body.style.overflow = '';
  });

  it('keeps the desktop side slide', () => {
    mockMobile = false;
    render(
      <EntityOverlayProvider>
        <Harness layout={false} />
      </EntityOverlayProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'open overlay' }));
    const panel = screen.getByTestId('entity-overlay');
    expect(panel.className).toContain('translate-x');
    expect(document.querySelector('[data-part="sheet"]')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2);
  });

  it('stacks the mobile overlay above the side pane and close all clears both', () => {
    mockMobile = true;
    render(
      <EntityOverlayProvider>
        <Harness layout />
      </EntityOverlayProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'open overlay' }));
    expectLayers();
    fireEvent.click(screen.getAllByRole('button', { name: 'Back' })[1]);
    expectOnlySide();
    fireEvent.click(screen.getByRole('button', { name: 'open overlay' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close all' }));
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    expect(document.body.style.overflow).toBe('');
  });
});
