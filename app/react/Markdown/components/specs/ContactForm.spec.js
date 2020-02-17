import React from 'react';

import { shallow } from 'enzyme';
import api from 'app/utils/api';
import { ContactForm } from '../ContactForm.js';

describe('ContactForm', () => {
  let props;

  beforeEach(() => {
    spyOn(api, 'post').and.returnValue(Promise.resolve());
    props = { notify: () => {} };
  });

  it('should render the ContactForm', () => {
    const component = shallow(<ContactForm {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should submit the values', done => {
    const formData = {
      name: 'Peter Parker',
      email: 'peter@parker.com',
      message: 'I miss uncle Ben',
    };
    props.notify = () => {
      expect(api.post).toHaveBeenCalledWith('contact', formData);
      done();
    };
    const component = shallow(<ContactForm {...props} />);
    component.instance().setState(formData);
    const form = component.find('form');
    form.simulate('submit', { preventDefault: () => {} });
  });
});
