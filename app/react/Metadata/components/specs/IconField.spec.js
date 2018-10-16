import React from 'react';

import { FormValue } from 'app/Forms';
import { shallow } from 'enzyme';
import ToggleDisplay from 'app/Layout/ToggleDisplay';

import { IconField } from '../IconField';

describe('IconField', () => {
  let props;
  beforeEach(() => {
    props = {
      removeIcon: jasmine.createSpy('removeIcon')
    };
  });
  it('should render IconSelector with toggleDisplay', () => {
    const component = shallow(<IconField {...props} model="model.value"/>).find(FormValue).prop('children')();
    expect(component).toMatchSnapshot();
  });

  it('should be open when has value', () => {
    const component = shallow(<IconField {...props} model="model.value"/>).find(FormValue).prop('children')({ _id: 'id' });
    expect(component).toMatchSnapshot();
  });

  it('should call removeIcon on hide', () => {
    const component = shallow(<span>{shallow(<IconField {...props} model="model.value"/>).find(FormValue).prop('children')('value')}</span>);
    component.find(ToggleDisplay).props().onHide();
    expect(props.removeIcon).toHaveBeenCalledWith('model.value.icon');
  });
});
