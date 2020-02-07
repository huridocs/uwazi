/**
 * @jest-environment jsdom
 */
import { Form } from 'react-redux-form';
import { browserHistory } from 'react-router';
import React from 'react';

import { shallow } from 'enzyme';

import SearchBox from '../SearchBox';

describe('SearchBox', () => {
  let component;

  beforeEach(() => {
    component = shallow(<SearchBox className="custom-class" placeholder="placeholder text" />);
  });

  it('should render a basic input that binds to the correct model', () => {
    expect(component).toMatchSnapshot();
  });

  it('should call the search action on submit', () => {
    spyOn(browserHistory, 'push');
    component
      .find(Form)
      .props()
      .onSubmit({ searchTerm: 'text with spaces' });
    expect(browserHistory.push).toHaveBeenCalledWith("/library/?q=(searchTerm:'text with spaces')");
  });
});
