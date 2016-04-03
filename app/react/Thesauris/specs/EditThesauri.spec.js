import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from '~/config.js';
import EditThesauri from '~/Thesauris/EditThesauri';
import ThesauriForm from '~/Thesauris/components/ThesauriForm';
import RouteHandler from '~/controllers/App/RouteHandler';

describe('EditThesauri', () => {
  let thesauri = {name: 'Countries', values: [{id: '1', label: 'label1'}, {id: '2', label: 'label2'}]};
  let component;
  let instance;
  let props = jasmine.createSpyObj(['editThesauri']);
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<EditThesauri {...props}/>, {context});
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'thesauris?_id=thesauriId', 'GET', {body: JSON.stringify({rows: [thesauri]})});
  });

  it('should render a ThesauriForm', () => {
    expect(component.find(ThesauriForm).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauri using the param thesauriId', (done) => {
      EditThesauri.requestState({thesauriId: 'thesauriId'})
      .then((response) => {
        expect(response).toEqual(thesauri);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState(thesauri);
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'EDIT_THESAURI', thesauri: thesauri});
    });
  });
});
