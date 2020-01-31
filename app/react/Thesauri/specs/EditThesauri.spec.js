/** @format */

import React from 'react';
import backend from 'fetch-mock';
import { shallow } from 'enzyme';

import { APIURL } from 'app/config.js';
import EditThesauri from 'app/Thesauri/EditThesauri';
import ThesauriForm from 'app/Thesauri/components/ThesauriForm';
import RouteHandler from 'app/App/RouteHandler';

describe('EditThesauri', () => {
  const thesauri = {
    name: 'Countries',
    values: [
      { id: '1', label: 'label1' },
      { id: '2', label: 'label2' },
    ],
  };
  let component;
  const props = jasmine.createSpyObj(['editThesaurus']);
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<EditThesauri {...props} />, { context });

    backend.restore();
    backend.get(`${APIURL}thesauris?_id=thesauriId`, {
      body: JSON.stringify({ rows: [thesauri] }),
    });
  });

  afterEach(() => backend.restore());

  it('should render a ThesauriForm', () => {
    expect(component.find(ThesauriForm).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauris using the param thesauriId', async () => {
      const request = { data: { _id: 'thesauriId' } };
      const actions = await EditThesauri.requestState(request);

      expect(actions).toMatchSnapshot();
    });
  });
});
