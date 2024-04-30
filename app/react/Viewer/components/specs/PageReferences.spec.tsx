import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { Provider } from 'react-redux';
import configureStore, { MockStoreCreator } from 'redux-mock-store';

import { PageReferences } from '../PageReferences';

const mockStoreCreator: MockStoreCreator<object> = configureStore<object>([]);

describe('FormConfigInput', () => {
  let props: any;

  beforeEach(() => {
    props = {
      page: '3',
      onClick: jest.fn(),
    };
  });

  const render = () => {
    const store = mockStoreCreator({
      documentViewer: {
        doc: Immutable.fromJS({ sharedId: 'ab42' }),
        uiState: Immutable.fromJS({ activeReference: '2' }),
        targetDoc: Immutable.fromJS({}),
        targetDocReferences: Immutable.fromJS([]),
        references: Immutable.fromJS([
          { _id: '1', entity: 'ab42', reference: { selectionRectangles: [{ page: '2' }] } },
          { _id: '2', entity: 'ab42', reference: { selectionRectangles: [{ page: '3' }] } },
          {
            _id: '3',
            entity: 'ab42',
            reference: { selectionRectangles: [{ page: '3' }, { page: '4' }] },
          },
          { _id: '4', entity: 'ab42', reference: { selectionRectangles: [{ page: '5' }] } },
          { _id: '4', entity: 'ce87', reference: { selectionRectangles: [{ page: '3' }] } },
        ]),
      },
    });

    return shallow(
      <Provider store={store}>
        <PageReferences {...props} />
      </Provider>
    )
      .dive({ context: { store } })
      .dive();
  };

  it('should render Hihlight components with references of the page', () => {
    const component = render();
    const hihglights = component.find(Highlight);
    expect(hihglights.length).toBe(2);

    const firstHighlightProps: any = hihglights.at(0).props();
    expect(firstHighlightProps.textSelection).toEqual({ selectionRectangles: [{ regionId: '3' }] });
    expect(firstHighlightProps.color).toBe('#ffd84b');

    const secondHighlightProps: any = hihglights.at(1).props();
    expect(secondHighlightProps.color).toBe('#feeeb4');
  });
});
