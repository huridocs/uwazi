/**
 * @jest-environment jsdom
 */
import React from 'react';
import Immutable from 'immutable';
import { RenderResult } from '@testing-library/react';
import { SelectionRectanglesSchema } from 'shared/types/commonTypes';
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

  const render = (
    file?: any | ClientFile,
    selections: {
      propertyID?: string;
      name: string;
      timestamp: string;
      selection: { text: 'string'; selectionRectangles: SelectionRectanglesSchema[] }[];
    }[] = []
  ) => {
    const store = {
      ...defaultState,
      documentViewer: {
        doc: Immutable.fromJS({
          defaultDoc: file || defaultEntityDocument,
        }),
        sidepanel: {
          metadata: entity,
        },
        metadataExtraction: Immutable.fromJS({
          selections,
        }),
      },
    };
    ({ renderResult } = renderConnectedContainer(<PageSelections />, () => store));
  };

  it('should only render when editing the entity and has a document', () => {
    entity = {};
    render();
    expect(renderResult.container.innerHTML).toBe('');

    entity = { _id: 'some_id' };
    render({});
    expect(renderResult.container.innerHTML).toBe('');
  });

  it('should highlight existing selections', () => {});

  it('should highligh new selections', () => {});
});
