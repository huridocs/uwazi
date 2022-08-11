import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { EntityTypesList } from '../EntityTypesList';

describe('EntityTypesList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      templates: Immutable.fromJS([
        { _id: 2, name: 'Ruling' },
        { _id: 1, name: 'Decision' },
        { _id: 3, name: 'Judge', isEntity: true },
      ]),
      notify: jasmine.createSpy('notify'),
      deleteTemplate: jasmine
        .createSpy('deleteTemplate')
        .and.callFake(async () => Promise.resolve()),
      setAsDefault: jasmine.createSpy('setAsDefault').and.callFake(async () => Promise.resolve()),
      checkTemplateCanBeDeleted: jasmine
        .createSpy('checkTemplateCanBeDeleted')
        .and.callFake(async () => Promise.resolve()),
    };

    context = {
      confirm: jasmine.createSpy('confirm'),
    };
  });

  const render = () => {
    component = shallow(<EntityTypesList {...props} />, { context });
  };

  it('should sort templates alphabetically', () => {
    render();
    const templatesList = component.find('.list-group-item');
    expect(templatesList.at(0).find('Link').at(0).props().children).toEqual('Decision');
    expect(templatesList.at(1).find('Link').at(0).props().children).toEqual('Judge');
    expect(templatesList.at(2).find('Link').at(0).props().children).toEqual('Ruling');
  });

  describe('when deleting a document type', () => {
    it('should check if can be deleted', done => {
      render();
      component
        .instance()
        .deleteTemplate({ _id: 3, name: 'Judge' })
        .then(() => {
          expect(props.checkTemplateCanBeDeleted).toHaveBeenCalled();
          done();
        });
    });

    it('should confirm the action', done => {
      render();
      component
        .instance()
        .deleteTemplate({ _id: 3, name: 'Judge' })
        .then(() => {
          expect(context.confirm).toHaveBeenCalled();
          done();
        });
    });
  });
});
