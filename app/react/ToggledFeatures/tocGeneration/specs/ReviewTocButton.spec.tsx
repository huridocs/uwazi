import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { Provider } from 'react-redux';
import { ClientFile } from 'app/istore';
import { ReviewTocButton } from '../ReviewTocButton';

describe('ReviewTocButton', () => {
  let component: ShallowWrapper<typeof ReviewTocButton>;

  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>([]);
  const render = (file: Partial<ClientFile>) => {
    const store: MockStore<object> = mockStoreCreator({});
    component = shallow(
      <Provider store={store}>
        <ReviewTocButton file={{ ...file, _id: 'id' }}>
          <span>test</span>
        </ReviewTocButton>
      </Provider>
    )
      .dive()
      .dive();
  };

  it('should render nothing if file generatedToc is false', () => {
    render({ generatedToc: false });
    expect(component.find('button').length).toEqual(0);

    render({});
    expect(component.find('button').length).toEqual(0);
  });

  it('should render when generatedToc is true', () => {
    render({ generatedToc: true });
    expect(component.find('button').length).toEqual(1);
  });
});
