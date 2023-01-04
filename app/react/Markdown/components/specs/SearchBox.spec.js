/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Form } from 'react-redux-form';
import { shallow } from 'enzyme';
import SearchBox from '../SearchBox';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

describe('SearchBox', () => {
  let component;

  beforeEach(() => {
    component = shallow(<SearchBox className="custom-class" placeholder="placeholder text" />);
  });

  it('should render a basic input that binds to the correct model', () => {
    expect(component).toMatchSnapshot();
  });

  it('should call the search action on submit', () => {
    component.find(Form).props().onSubmit({ searchTerm: 'text with spaces' });
    expect(mockUseNavigate).toHaveBeenCalledWith("/library/?q=(searchTerm:'text with spaces')");
  });
});
