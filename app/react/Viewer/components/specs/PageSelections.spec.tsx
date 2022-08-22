/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { RenderResult } from '@testing-library/react';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { ClientEntitySchema, ClientFile } from 'app/istore';
import { PageSelections } from '../PageSelections';

const defaultEntityDocument: ClientFile = {
  _id: '62f52bddc6897a159347cf6b',
  originalname: 'Get_Started_With_Smallpdf.pdf',
  type: 'document',
  totalPages: 2,
  entity: 'bc3prdymqj',
  filename: '1660234717101q3vq1v0vo7h.pdf',
  language: 'eng',
  extractedMetadata: [
    {
      propertyID: '62f290a54dd69a2472936453',
      name: 'my_property',
      timestamp: 'oldProperty',
      selection: {
        text: 'Selected text',
        selectionRectangles: [
          {
            top: 91,
            left: 32,
            width: 30,
            height: 26,
            page: '2',
          },
        ],
      },
    },
    {
      name: 'title',
      timestamp: 'oldTitle',
      selection: {
        text: 'The title of the PDF',
        selectionRectangles: [
          {
            top: 35,
            left: 261,
            width: 272,
            height: 41,
            page: '1',
          },
        ],
      },
    },
  ],
};

describe('Page selections highlights', () => {
  let renderResult: RenderResult;
  let entity: ClientEntitySchema = {
    _id: '62f52bdcc6897a159347cf59',
  };
  let file: any | ClientFile;
  let selections: ExtractedMetadataSchema[];

  beforeEach(() => {
    file = defaultEntityDocument;
    selections = [];
  });

  const render = () => {
    const state = {
      ...defaultState,
      documentViewer: {
        doc: Immutable.fromJS({
          defaultDoc: file,
        }),
        sidepanel: {
          metadata: entity,
        },
        metadataExtraction: Immutable.fromJS({
          selections,
        }),
      },
    };
    ({ renderResult } = renderConnectedContainer(<PageSelections />, () => state));
  };

  it('should only render when editing the entity and has a document', () => {
    entity = {};
    render();
    expect(renderResult.container.innerHTML).toBe('');

    entity = { _id: 'some_id' };
    file = {};
    render();
    expect(renderResult.container.innerHTML).toBe('');
  });

  it('should highlight existing selections', () => {
    render();
    expect(renderResult.container.children.length).toBe(2);
  });

  it('should highligh new selections', () => {
    selections = [
      {
        propertyID: '4356fdsassda',
        name: 'property_name',
        timestamp: 'today',
        selection: { text: 'new selected text', selectionRectangles: [{ top: 10, page: '1' }] },
      },
    ];
    render();
    expect(renderResult.container.children.length).toBe(3);
  });

  it('should update old title selection with the new one', () => {
    selections = [
      {
        name: 'title',
        timestamp: 'newTitle',
        selection: {
          text: 'new selected text to replace current title',
          selectionRectangles: [{ top: 10, page: '1' }],
        },
      },
    ];
    render();

    expect(renderResult.queryByTestId('oldTitle')).not.toBeInTheDocument();
    expect(renderResult.getByTestId('newTitle')).toBeInTheDocument();
  });

  it('should update the selections of the property with the new one', () => {
    selections = [
      {
        propertyID: '62f290a54dd69a2472936453',
        name: 'my_property',
        timestamp: 'newProperty',
        selection: {
          text: 'new selected text to replace current selected text for the property',
          selectionRectangles: [{ top: 10, page: '1' }],
        },
      },
    ];
    render();

    expect(renderResult.queryByTestId('oldProperty')).not.toBeInTheDocument();
    expect(renderResult.getByTestId('newProperty')).toBeInTheDocument();
  });
});
