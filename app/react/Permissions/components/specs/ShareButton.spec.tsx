import { shallow } from 'enzyme';
import React from 'react';
import { ShareButton } from '../ShareButton';
import { ShareEntityModal } from '../ShareEntityModal';

describe('ShareButton', () => {
  it('should not render the modal by default', () => {
    const component = shallow(<ShareButton sharedIds={['id1', 'id2']} storeKey="library" />);
    expect(component.find(ShareEntityModal).length).toBe(0);
  });

  it('should render the modal with the correct ids when clicked', () => {
    const component = shallow(<ShareButton sharedIds={['id1', 'id2']} storeKey="library" />);
    component.find('button').simulate('click');
    const modal = component.find(ShareEntityModal);
    expect(modal.length).toBe(1);
    expect(modal.get(0).props.sharedIds).toEqual(['id1', 'id2']);
  });

  it('should close the modal when onClose called', () => {
    const component = shallow(<ShareButton sharedIds={['id1', 'id2']} storeKey="library" />);
    component.find('button').simulate('click');
    component.find(ShareEntityModal).simulate('close');
    expect(component.find(ShareEntityModal).length).toBe(0);
  });
});
