import React from 'react';
import {shallow} from 'enzyme';

import NewThesauri from '~/Thesauris/NewThesauri';
import ThesauriForm from '~/Thesauris/components/ThesauriForm';

describe('NewThesauri', () => {
  let component;

  beforeEach(() => {
    component = shallow(<NewThesauri />);
  });

  it('should render a ThesauriForm', () => {
    expect(component.find(ThesauriForm).length).toBe(1);
  });
});
