/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import { Point } from '../Components/Point.js';
import { RelationshipMarker } from '../types.js';

const marker: RelationshipMarker = {
  _id: 'ref-partner-33',
  view: {
    _id: 'ref-partner-33',
    hub: 'h1',
    type: 'rel-type',
    from: {
      type: 'textReference',
      entity: 'entity1',
      entityTitle: 'Source',
      entityTemplateId: 'template1',
      file: 'file1',
      text: 'selected',
      selections: [{ page: 20, top: 10, left: 20, width: 100, height: 30 }],
    },
    to: {
      type: 'entity',
      entity: 'target1',
      entityTitle: 'Person 2',
      entityTemplateId: 'template3',
    },
    relationTypeOnSelf: false,
  },
  target: { sharedId: 'target1', title: 'Person 2', templateId: 'template3' },
  anchor: {
    type: 'textReference',
    entity: 'entity1',
    entityTitle: 'Source',
    entityTemplateId: 'template1',
    file: 'file1',
    text: 'selected',
    selections: [{ page: 20, top: 10, left: 20, width: 100, height: 30 }],
  },
};

describe('Point', () => {
  const store = createStore();
  store.set(templatesAtom, [{ _id: 'template3', color: '#2b8a3e', name: 'Person' }]);

  it('renders active styling', () => {
    render(
      <Provider store={store}>
        <Point marker={marker} position={0} onClick={() => undefined} isActive />
      </Provider>
    );

    const dot = screen.getByTestId('rail-marker-dot');
    expect(dot).toHaveStyle({ width: '12px' });
    expect(dot.style.boxShadow).not.toBe('none');
  });

  it('shows the target title in the tooltip', () => {
    render(
      <Provider store={store}>
        <Point marker={marker} position={0} onClick={() => undefined} />
      </Provider>
    );

    fireEvent.mouseOver(screen.getByTestId('rail-marker-dot'));

    expect(screen.getByRole('tooltip')).toHaveTextContent('Person 2');
  });
});
