import React from 'react';
import {shallow} from 'enzyme';

import NewTemplate from '~/Templates/NewTemplate';
import TemplateCreator from '~/Templates/components/TemplateCreator';
// import RouteHandler from '~/controllers/App/RouteHandler';

describe('NewTemplate', () => {
  let component;

  beforeEach(() => {
    // RouteHandler.renderedFromServer = true;
    component = shallow(<NewTemplate />);
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });
});
