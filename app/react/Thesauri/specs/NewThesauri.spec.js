/** @format */

import React from 'react';
import { shallow } from 'enzyme';

import NewThesauri from 'app/Thesauri/NewThesauri';
import ThesauriForm from 'app/Thesauri/components/ThesauriForm';
import api from 'app/Thesauri/ThesauriAPI';

describe('NewThesauri', () => {
  let component;
  let context;
  const thesauris = [
    {
      name: 'Countries',
      values: [
        { id: '1', label: 'label1' },
        { id: '2', label: 'label2' },
      ],
    },
  ];

  beforeEach(() => {
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    spyOn(api, 'get').and.callFake(async () => Promise.resolve(thesauris));
    component = shallow(<NewThesauri />, { context });
  });

  it('should render a ThesauriForm with new=true', () => {
    expect(component.find(ThesauriForm).length).toBe(1);
    expect(component.find(ThesauriForm).props().new).toBe(true);
  });

  describe('static requestState()', () => {
    it('should request the thesauris', async () => {
      const actions = await NewThesauri.requestState();
      expect(actions).toMatchSnapshot();
    });
  });
});
