import React from 'react';

import { shallow } from 'enzyme';
import api from 'app/utils/api';
import { ContactForm } from '../ContactForm.js';

describe('ContactForm', () => {
  let props;

  beforeEach(() => {
    spyOn(api, 'post').and.callFake(async () => Promise.resolve());
    props = { notify: () => {} };
  });

  it('should render the ContactForm', () => {
    const component = shallow(<ContactForm {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should submit the values', () => {
    const formData = {
      name: 'Peter Parker',
      email: 'peter@parker.com',
      message: 'I miss uncle Ben',
    };

    const component = shallow(<ContactForm {...props} />);
    component.instance().setState(formData);
    component.find('form').simulate('submit', { preventDefault: () => {} });
    expect(api.post).toHaveBeenCalledWith('contact', { data: formData, headers: {} });
  });
});
