import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { EntityTypesList } from '../EntityTypesList';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  // eslint-disable-next-line jsx-a11y/anchor-has-content, react/prop-types
  Link: props => <a {...props} href={props.to} />,
}));

describe('EntityTypesList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      templates: Immutable.fromJS([
        { _id: 2, name: 'Ruling' },
        { _id: 1, name: 'Decision' },
        { _id: 3, name: 'Judge', isEntity: true },
      ]),
      locale: 'en',
      languages: Immutable.fromJS([
        { _id: 1, key: 'en', default: true },
        { _id: 2, key: 'es' },
      ]),
      notify: jasmine.createSpy('notify'),
      deleteTemplate: jasmine
        .createSpy('deleteTemplate')
        .and.callFake(async () => Promise.resolve()),
      setAsDefault: jasmine.createSpy('setAsDefault').and.callFake(async () => Promise.resolve()),
      checkTemplateCanBeDeleted: jasmine
        .createSpy('checkTemplateCanBeDeleted')
        .and.callFake(async () => Promise.resolve()),
      mainContext: { confirm: jest.fn() },
    };
  });

  const render = () => {
    component = shallow(<EntityTypesList {...props} />);
  };

  it('should sort templates alphabetically', () => {
    render();
    const templatesList = component.find('li');
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
          expect(props.mainContext.confirm).toHaveBeenCalled();
          done();
        });
    });
  });
});
