import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';

import DocumentResultsPanel from '../DocumentResultsPanel';

describe('DocumentResultsPanel', () => {
  let state;
  let store;
  beforeEach(() => {
    state = {
      templates: [],
      semanticSearch: {
        selectedDocument: Immutable.fromJS({ _id: 'sharedId' })
      },
      library: {
        sidepanel: {
          references: [],
          tab: 'tab',
          metadata: [],
          metadataForm: {
            $form: { pristine: true }
          }
        },
        search: {
          searchTerm: 'search term'
        }
      }
    };
    store = {
      getState: jest.fn(() => state),
      subscribe: jest.fn(),
      dispatch: jest.fn()
    };
  });
  const render = () => shallow(<DocumentResultsPanel store={store} />);

  it('should render DocumentSidePanel with the current semantic search document', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });
});
