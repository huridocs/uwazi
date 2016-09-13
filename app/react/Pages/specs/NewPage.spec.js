import React from 'react';
import {shallow} from 'enzyme';
import NewPage from '../NewPage';
import PageCreator from 'app/Pages/components/PageCreator';

describe('NewPage', () => {
  let component;

  beforeEach(() => {
    let context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<NewPage />, {context});
  });

  it('should render a PageCreator', () => {
    expect(component.find(PageCreator).length).toBe(1);
  });
});
