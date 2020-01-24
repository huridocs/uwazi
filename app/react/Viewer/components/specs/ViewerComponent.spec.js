/** @format */

import { fromJS } from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';
import { ViewerComponent } from '../ViewerComponent';
import PDFView from '../../PDFView';
import EntityView from '../../EntityView';

describe('ViewerComponent', () => {
  let component;
  const entity = { _id: 'id', sharedId: 'sharedId', file: {} };

  const render = () => {
    component = shallow(<ViewerComponent entity={fromJS(entity)} location={{}} />);
  };
  describe('when the entity has file', () => {
    it('should render a PDFView', () => {
      render();
      expect(component.find(PDFView).length).toBe(1);
    });
  });

  describe('when the entity does not have file', () => {
    it('should render a EntityView', () => {
      delete entity.file;
      render();
      expect(component.find(EntityView).length).toBe(1);
    });
  });
});
