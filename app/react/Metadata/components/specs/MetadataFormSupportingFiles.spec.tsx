import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { Provider } from 'react-redux';

import { MetadataFormSupportingFiles } from '../MetadataFormSupportingFiles';

describe('Metadata form supporting files', () => {
  let component: ShallowWrapper<typeof MetadataFormSupportingFiles>;
  let store: MockStore<object>;
  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>();

  beforeEach(() => {
    store = mockStoreCreator({
      library: {
        sidepanel: {
          metadata: {
            _id: 'entity_id',
            attachments: [
              {
                _id: 'file_id',
                originalname: 'fileName.jpg',
              },
            ],
          },
        },
      },
      entityView: { entityForm: {} },
    });
  });

  const render = () => {
    component = shallow(
      <Provider store={store}>
        <MetadataFormSupportingFiles storeKey="library" />
      </Provider>
    )
      .dive()
      .dive();
  };

  it('should pass existing attachements if editing an entity', () => {
    render();
    expect(component.props()).toEqual(
      expect.objectContaining({ attachments: [{ _id: 'file_id', originalname: 'fileName.jpg' }] })
    );
  });

  it('should pass an empty array if there are no attachments', () => {
    store = mockStoreCreator({
      library: { sidepanel: { metadata: {} } },
      entityView: { entityForm: {} },
    });
    render();
    expect(component.props()).toEqual(expect.objectContaining({ attachments: [] }));
  });
});
