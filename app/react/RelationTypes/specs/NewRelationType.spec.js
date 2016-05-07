import React from 'react';
import {shallow} from 'enzyme';

import NewRelationType from 'app/RelationTypes/NewRelationType';
import RelationTypeForm from 'app/RelationTypes/components/RelationTypeForm';

describe('NewRelationType', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NewRelationType />);
  });

  it('should render a RelationTypeForm', () => {
    expect(component.find(RelationTypeForm).length).toBe(1);
  });
});
