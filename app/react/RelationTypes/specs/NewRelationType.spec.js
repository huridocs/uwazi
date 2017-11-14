import React from 'react';
import {shallow} from 'enzyme';

import NewRelationType from 'app/RelationTypes/NewRelationType';
import TemplateCreator from '../../Templates/components/TemplateCreator';

describe('NewRelationType', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NewRelationType />);
  });

  it('should render a RelationTypeForm', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });
});
