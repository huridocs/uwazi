import React from 'react';
import thunk from 'redux-thunk';
import { shallow, ShallowWrapper } from 'enzyme';
import ReactModal from 'react-modal';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { MediaModalCmp, MediaModalProps } from '../MediaModal';

const mockStore = configureMockStore([thunk]);
const store = mockStore({});

describe('Attachments Modal', () => {
  let component: ShallowWrapper;
  let props: MediaModalProps;

  beforeEach(() => {
    props = {
      onClose: jasmine.createSpy('onClose'),
      onChange: jasmine.createSpy('onChange'),
      isOpen: true,
      attachments: [],
      selectedId: '1',
    };
  });

  const render = (otherProps = {}) => {
    component = shallow(
      <Provider store={store}>
        <MediaModalCmp {...props} {...otherProps} />
      </Provider>
    ).dive();
  };

  it('Should pass isOpen props to Media modal.', () => {
    render({ isOpen: false });
    expect(component.find(ReactModal).props().isOpen).toBe(false);
    render({ isOpen: true });
    expect(component.find(ReactModal).props().isOpen).toBe(true);
  });

  it('Should call onClose', () => {
    render();

    const closeButton = component.find('.attachments-modal__close');
    closeButton.simulate('click');

    expect(props.onClose).toHaveBeenCalled();
  });
});
