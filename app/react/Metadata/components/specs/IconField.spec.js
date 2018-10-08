import React from 'react';

import { shallow } from 'enzyme';

import { IconField } from '../IconField';
import ToggleDisplay from 'app/Layout/ToggleDisplay';
import { StoreValue } from 'app/Layout';

describe('IconField', () => {
  let props;
  beforeEach(() => {
    props = {
      removeIcon: jasmine.createSpy('removeIcon')
    };
  });
  it('should render IconSelector with toggleDisplay', () => {
    const component = shallow(<IconField {...props} model="model.value"/>).find(StoreValue).prop('children')();
    expect(component).toMatchSnapshot();
  });

  it('should be open when has value', () => {
    const component = shallow(<IconField {...props} model="model.value"/>).find(StoreValue).prop('children')('value');
    expect(component).toMatchSnapshot();
  });

  it('should call removeIcon on hide', () => {
    const component = shallow(<span>{shallow(<IconField {...props} model="model.value"/>).find(StoreValue).prop('children')('value')}</span>);
    component.find(ToggleDisplay).props().onHide();
    expect(props.removeIcon).toHaveBeenCalledWith('model.value.icon');
  });
});
