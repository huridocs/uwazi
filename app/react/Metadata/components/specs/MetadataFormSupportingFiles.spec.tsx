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
    store = mockStoreCreator({});
  });

  const render = () => {
    component = shallow(
      <Provider store={store}>
        <MetadataFormSupportingFiles storeKey="library" />
      </Provider>
    );
  };

  it('should pass existing attachements if any during edit mode', () => {
    render();
    console.log(component.debug());
  });
});
