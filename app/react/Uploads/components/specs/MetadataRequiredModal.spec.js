import React from 'react';
import {shallow} from 'enzyme';
import {Link} from 'react-router';
import Immutable from 'immutable';

import {MetadataRequiredModal} from 'app/Uploads/components/MetadataRequiredModal.js';
import Modal from 'app/Layout/Modal';

describe('MetadataRequiredModal', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      hideModal: jasmine.createSpy('hideModal'),
      doc: Immutable.fromJS({_id: 'docId', title: 'test'})
    };
  });

  let render = () => {
    component = shallow(<MetadataRequiredModal {...props} />);
  };

  it('should open modal if doc is not undefined', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(true);
  });

  it('should render a Link to document viewer', () => {
    render();
    let link = component.find(Link);
    expect(link.props().to).toBe('/document/docId');
    link.simulate('click');
    expect(props.hideModal).toHaveBeenCalledWith('metadataRequired');
  });

  describe('when clicking cancel button', () => {
    it('should call hideModal', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.hideModal).toHaveBeenCalledWith('metadataRequired');
    });
  });
});
