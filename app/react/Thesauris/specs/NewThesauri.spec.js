import React from 'react';
import {shallow} from 'enzyme';

import NewThesauri from 'app/Thesauris/NewThesauri';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';
import api from 'app/Thesauris/ThesaurisAPI';

describe('NewThesauri', () => {
  let component;
  let instance;
  let context;
  let thesauris = [{name: 'Countries', values: [{id: '1', label: 'label1'}, {id: '2', label: 'label2'}]}];

  beforeEach(() => {
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    spyOn(api, 'get').and.returnValue(Promise.resolve(thesauris));
    component = shallow(<NewThesauri />, {context});
    instance = component.instance();
  });

  it('should render a ThesauriForm with new=true', () => {
    expect(component.find(ThesauriForm).length).toBe(1);
    expect(component.find(ThesauriForm).props().new).toBe(true);
  });

  describe('static requestState()', () => {
    it('should request the thesauris', (done) => {
      NewThesauri.requestState()
      .then((state) => {
        expect(state).toEqual({thesauris});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({thesauris});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'thesauris/SET', value: thesauris});
    });
  });
});
