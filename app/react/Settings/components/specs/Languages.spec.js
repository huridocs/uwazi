import Immutable from 'immutable';
import React from 'react';

import { shallow } from 'enzyme';
import { Languages } from '../Languages';

describe('Languages', () => {
  let component;
  let props;
  let context;
  const currentLanguages = [
    { label: 'Español', key: 'es', default: true },
    { label: 'English', key: 'en' },
  ];

  beforeEach(() => {
    props = {
      languages: Immutable.fromJS(currentLanguages),
      setDefaultLanguage: jasmine
        .createSpy('setDefaultLanguage')
        .and.returnValue(Promise.resolve('ok')),
      addLanguage: jasmine.createSpy('addLanguage').and.returnValue(Promise.resolve('ok')),
      deleteLanguage: jasmine.createSpy('deleteLanguage').and.returnValue(Promise.resolve('ok')),
      locale: 'es',
    };
    context = { confirm: jasmine.createSpy('confirm') };
    component = shallow(<Languages {...props} />, { context });
  });

  it('should render Languages component', () => {
    expect(component).toMatchSnapshot();
  });

  describe('clicking on Set as default', () => {
    it('should call setDefaultLanguage', done => {
      component
        .find('.btn-success')
        .at(0)
        .simulate('click');
      expect(props.setDefaultLanguage).toHaveBeenCalledWith('en');
      done();
    });
  });

  describe('clicking on Delete Language', () => {
    it('should call delete languae', done => {
      component
        .find('.btn-danger')
        .at(0)
        .simulate('click');
      expect(context.confirm).toHaveBeenCalled();
      const confirmArguments = context.confirm.calls.allArgs()[0][0];
      confirmArguments.accept();
      expect(props.deleteLanguage).toHaveBeenCalledWith('en');
      done();
    });
  });

  describe('clicking on Add Language', () => {
    it('should call add language', done => {
      component
        .find('.btn-success')
        .at(1)
        .simulate('click');
      expect(context.confirm).toHaveBeenCalled();
      const confirmArguments = context.confirm.calls.allArgs()[0][0];
      confirmArguments.accept();
      expect(props.addLanguage).toHaveBeenCalledWith({ key: 'ab', label: 'Abkhazian' });
      done();
    });
  });
});
