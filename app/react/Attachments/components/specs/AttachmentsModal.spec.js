import React from 'react';
import { shallow } from 'enzyme';

import ReactModal from 'react-modal';
import AttachmentsModal from '../AttachmentsModal';

describe('Attachments Modal', () => {
  let component;

  const render = (props = {}) => {
    component = shallow(
      <AttachmentsModal {...props}>
        <div />
      </AttachmentsModal>
    );
  };

  it('Should pass isOpen props to attachments modal.', () => {
    render({ isOpen: false });
    expect(component.find(ReactModal).props().isOpen).toBe(false);
    render({ isOpen: true });
    expect(component.find(ReactModal).props().isOpen).toBe(true);
  });
});
