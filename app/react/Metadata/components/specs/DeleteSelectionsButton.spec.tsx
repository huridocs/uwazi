/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { fireEvent, RenderResult, act } from '@testing-library/react';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { ClientFile } from 'app/istore';
import { DeleteSelectionButton } from '../DeleteSelectionButton';
import * as actions from '../../actions/metadataExtractionActions';

describe('Delete selections button', () => {
  let renderResult: RenderResult;
  let fileSelections: ExtractedMetadataSchema[];
  let userSelections: ExtractedMetadataSchema[];
  let entityDocument: ClientFile;
  let propertyName: string;
  let propertyID: string;

  beforeEach(() => {
    propertyName = 'title';
    propertyID = '1';
    fileSelections = [
      {
        name: 'title',
        selection: {
          text: 'text for title',
          selectionRectangles: [],
        },
      },
      {
        name: 'property1',
        propertyID: '1',
        selection: {
          text: 'text for the property',
          selectionRectangles: [],
        },
      },
    ];
    userSelections = [];
    entityDocument = {
      _id: '62f52bdcc6897a159347cf59',
      extractedMetadata: fileSelections,
    };
  });

  const render = () => {
    const state = {
      ...defaultState,
      documentViewer: {
        doc: Immutable.fromJS({
          defaultDoc: entityDocument,
        }),
        metadataExtraction: Immutable.fromJS({
          selections: userSelections,
        }),
      },
    };
    ({ renderResult } = renderConnectedContainer(
      <DeleteSelectionButton propertyName={propertyName} propertyID={propertyID} />,
      () => state
    ));
  };

  it('should render if there is a selection for the property', () => {
    render();
    expect(renderResult.getByText('Clear PDF selection')).toBeInTheDocument();
  });

  it('should render if the user creates a selection for the property', () => {
    propertyName = 'text';
    propertyID = '3';
    userSelections = [
      {
        name: 'text',
        propertyID: '3',
        selection: {},
      },
    ];
    render();
    expect(renderResult.getByText('Clear PDF selection')).toBeInTheDocument();
  });

  it('should not render if there is not a selection for the property', () => {
    propertyName = 'withNoSelections';
    propertyID = '2';
    render();
    expect(renderResult.queryByText('Clear PDF selection')).not.toBeInTheDocument();
  });

  it('should not render if the selections for the property are marked for deletion', () => {
    userSelections = [
      {
        name: 'title',
        selection: {},
        deleteSelection: true,
      },
    ];
    render();
    expect(renderResult.queryByText('Clear PDF selection')).not.toBeInTheDocument();
  });

  it('should call the delete selection action on click', async () => {
    jest.spyOn(actions, 'deleteSelection');
    render();
    const button = renderResult.getByText('Clear PDF selection').parentElement!;
    await act(() => {
      fireEvent.click(button);
    });
    expect(actions.deleteSelection).toHaveBeenCalledWith(
      Immutable.fromJS(entityDocument),
      'title',
      '1'
    );
  });
});
