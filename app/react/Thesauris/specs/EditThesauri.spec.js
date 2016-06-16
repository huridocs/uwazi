import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import EditThesauri from 'app/Thesauris/EditThesauri';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';
import RouteHandler from 'app/App/RouteHandler';

describe('EditThesauri', () => {
  let thesauri = {name: 'Countries', values: [{id: '1', label: 'label1'}, {id: '2', label: 'label2'}]};
  let component;
  let props = jasmine.createSpyObj(['editThesauri']);
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<EditThesauri {...props}/>, {context});

    backend.restore();
    backend
    .mock(APIURL + 'thesauris?_id=thesauriId', 'GET', {body: JSON.stringify({rows: [thesauri]})});
  });

  it('should render a ThesauriForm', () => {
    expect(component.find(ThesauriForm).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauris using the param thesauriId', (done) => {
      EditThesauri.requestState({thesauriId: 'thesauriId'})
      .then((state) => {
        expect(state).toEqual({thesauri: {data: thesauri}});
        done();
      })
      .catch(done.fail);
    });
  });
});
