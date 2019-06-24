import React from 'react';
import { shallow } from 'enzyme';

import NewRelationType from 'app/RelationTypes/NewRelationType';
import TemplateCreator from '../../Templates/components/TemplateCreator';

describe('NewRelationType', () => {
  let component;

  beforeEach(() => {
    const context = { store: { getState: () => ({}) } };
    component = shallow(<NewRelationType />, { context });
  });

  it('should render a RelationTypeForm', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });
});
