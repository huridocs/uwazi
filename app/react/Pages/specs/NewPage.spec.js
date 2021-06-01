import React from 'react';
import { shallow } from 'enzyme';
import { PageCreator } from 'app/Pages/components/PageCreator';
import NewPage from '../NewPage';

describe('NewPage', () => {
  let component;

  beforeEach(() => {
    const context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<NewPage />, { context });
  });

  it('should render a PageCreator', () => {
    expect(component.find(PageCreator).length).toBe(1);
  });
});
