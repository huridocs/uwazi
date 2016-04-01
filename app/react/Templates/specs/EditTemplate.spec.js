import React from 'react';

import {shallow} from 'enzyme';
import {EditTemplate} from '~/Templates/EditTemplate';
import RouteHandler from '~/controllers/App/RouteHandler';

describe('EditTemplate', () => {
  let component;
  let saveTemplate = jasmine.createSpy('saveTemplate');
  let props;

  beforeEach(() => {
    props = {saveTemplate, template: {name: '', properties: []}};
    RouteHandler.renderedFromServer = false;
    component = shallow(<EditTemplate {...props} />);
  });

  describe('clicking save button', () => {
    it('should call saveTemplate action with the template in props', () => {
      component.find('.save-template').simulate('click');
      expect(saveTemplate).toHaveBeenCalledWith(props.template);
    });
  });
});
