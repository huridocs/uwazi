/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { screen, act, fireEvent } from '@testing-library/react';

import { notificationActions } from '#app/Notifications/index.js';

import { defaultState, renderConnectedContainer } from '#app/utils/test/renderConnected.jsx';
import * as actions from '#app/Metadata/actions/metadataExtractionActions.js';
import { MetadataExtractor, Selection } from '#app/Metadata/components/MetadataExtractor.jsx';

describe('MetadataExtractor', () => {
  let selected: Selection | undefined;

  beforeEach(() => {
    spyOn(actions, 'updateSelection').and.returnValue(() => { });
    spyOn(actions, 'updateFormField').and.returnValue(() => { });
    spyOn(notificationActions, 'notify').and.returnValue(() => { });
    selected = {
      text: 'a user selected text',
      selectionRectangles: [{ top: 1, left: 2, width: 10, height: 1, page: '1' }],
    };
  });

  const render = () => {
    const state = {
      ...defaultState,
      documentViewer: {
        uiState: Immutable.fromJS({ reference: { sourceRange: selected } }),
      },
    };
    renderConnectedContainer(
      <MetadataExtractor fieldName="field" model="documentViewer.sidepanel.metadata" locale="en" />,
      () => state
    );
  };

  it('should render when there is a selection', () => {
    render();
    expect(screen.getByText('Click to fill')).toBeInTheDocument();
  });

  it('should not render if theres not a selection', () => {
    selected = undefined;
    render();
    expect(screen.queryByText('Click to fill')).not.toBeInTheDocument();
  });

  it('should call update store function and the react redux form change function on click', async () => {
    render();

    const button = screen.queryByText('Click to fill')?.parentElement!;
    await act(() => {
      fireEvent.click(button);
    });

    expect(actions.updateSelection).toHaveBeenCalledWith(
      Immutable.fromJS({
        text: 'a user selected text',
        selectionRectangles: [{ top: 1, left: 2, width: 10, height: 1, page: '1' }],
      }),
      'field',
      undefined
    );
    expect(actions.updateFormField).toHaveBeenCalledWith(
      undefined,
      'documentViewer.sidepanel.metadata',
      undefined,
      'en'
    );
  });

  it('should notify the user if the selection rectangle is empty', async () => {
    selected = {
      text: 'a text that failed to get the rectangles',
      selectionRectangles: [],
    };

    render();

    const button = screen.queryByText('Click to fill')?.parentElement!;
    await act(() => {
      fireEvent.click(button);
    });

    expect(notificationActions.notify).toHaveBeenCalledWith(
      'Could not detect the area for the selected text',
      'warning'
    );

    expect(actions.updateSelection).toHaveBeenCalledWith(
      Immutable.fromJS({
        text: 'a text that failed to get the rectangles',
        selectionRectangles: [],
      }),
      'field',
      undefined
    );
  });
});
