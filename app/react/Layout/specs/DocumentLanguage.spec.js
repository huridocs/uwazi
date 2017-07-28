import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import {DocumentLanguage, mapStateToProps} from '../DocumentLanguage';

describe('DocumentLanguage', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      doc: Immutable({
        type: 'entity',
        icon: {_id: 'icon', type: 'Icons'},
        title: 'doc title',
        template: 'templateId',
        creationDate: 123,
        snippets: []
      })
    };
  });

  let render = () => {
    component = shallow(<DocumentLanguage {...props} />);
  };

  it('should not show a language if doc is not a document-type entity is not present', () => {
    render();
    expect(component.node).toBe(null);
  });

  describe('When file matches current locale', () => {
    it('should not show a language', () => {
      props.locale = 'es';
      props.doc = props.doc.set('file', Immutable({language: 'spa'}));

      render();

      expect(component.node).toBe(null);
    });
  });

  describe('When file does not match current locale', () => {
    it('should include language tag ISO639-1 if file language is a supported language', () => {
      props.locale = 'es';
      props.doc = props.doc.set('file', Immutable({language: 'eng'}));

      render();

      expect(component.find('.item-type__documentLanguage').length).toBe(1);
      expect(component.find('.item-type__documentLanguage').text()).toBe('en');

      props.locale = 'es';
      props.doc = props.doc.set('file', Immutable({language: 'por'}));

      render();

      expect(component.find('.item-type__documentLanguage').length).toBe(1);
      expect(component.find('.item-type__documentLanguage').text()).toBe('pt');
    });

    it('should include language tag in FRANC detection if file language is not supported language', () => {
      props.locale = 'es';
      props.doc = props.doc.set('file', Immutable({language: 'not'}));

      render();

      expect(component.find('.item-type__documentLanguage').length).toBe(1);
      expect(component.find('.item-type__documentLanguage').text()).toBe('not');
    });

    it('should render OTHER if file language is undetected', () => {
      props.locale = 'es';
      props.doc = props.doc.set('file', Immutable({language: 'other'}));

      render();

      expect(component.find('.item-type__documentLanguage').length).toBe(1);
      expect(component.find('.item-type__documentLanguage').text()).toBe('Other');
    });
  });

  describe('mapStateToProps', () => {
    let locale;

    beforeEach(() => {
      locale = 'lc';
    });

    it('should include locale', () => {
      expect(mapStateToProps({locale})).toEqual({locale});
    });
  });
});
