/** @format */

import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { DragAndDropContainer } from 'app/Layout/DragAndDrop';
import { mapStateToProps, ThesauriForm } from 'app/Thesauri/components/ThesauriForm.js';

describe('ThesauriForm', () => {
  let props;
  let component;
  let instance;
  beforeEach(() => {
    props = {
      thesauri: {
        _id: '123',
        name: 'thesauri name',
        values: [
          { label: 'Heroes', values: [{ label: 'Batman' }, { label: 'Robin' }] },
          { label: 'Villains', values: [{ label: 'Joker' }, { label: 'Penguin' }] },
        ],
      },
      resetForm: jasmine.createSpy('resetForm'),
      setInitial: jasmine.createSpy('setInitial'),
      thesauris: Immutable.fromJS([{ name: 'Countries' }]),
      saveThesaurus: jasmine.createSpy('saveThesaurus'),
      importThesaurus: jasmine.createSpy('importThesaurus'),
      addValue: jasmine.createSpy('addValue'),
      addGroup: jasmine.createSpy('addGroup'),
      sortValues: jasmine.createSpy('sortValues'),
      removeValue: jasmine.createSpy('removeValue'),
      updateValues: jasmine.createSpy('updateValues'),
      state: { fields: [], $form: {} },
    };
  });

  const render = () => {
    component = shallow(<ThesauriForm {...props} />);
    instance = component.instance();
  };

  describe('when unmount', () => {
    it('should reset the form', () => {
      render();
      component.unmount();
      expect(props.resetForm).toHaveBeenCalled();
      expect(props.setInitial).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('should render DragAndDropContainer with thesauri items', () => {
      render();
      expect(component.find(DragAndDropContainer).props().renderItem).toBe(
        component.instance().renderItem
      );
      expect(component).toMatchSnapshot();
    });
  });

  describe('renderItem', () => {
    it('should render ThesauriFormItem with specified value and index', () => {
      render();
      const renderedItem = component.instance().renderItem(props.thesauri.values[1], 1);
      expect(renderedItem).toMatchSnapshot();
    });
  });

  describe('save()', () => {
    it('should sanitize the thesauri and save it', () => {
      render();
      const thesauri = {
        values: [
          { label: 'Heroes', values: [{ label: 'Batman' }, { label: 'Robin' }], id: 0 },
          { label: '', values: [{ label: 'Joker' }, { label: 'Penguin' }], id: 1 },
          { label: 'I have no values', values: [], id: 3 },
          { label: '', id: 4 },
        ],
      };
      instance.save(thesauri);
      const sanitizedThesauri = {
        values: [{ label: 'Heroes', values: [{ label: 'Batman' }, { label: 'Robin' }], id: 0 }],
      };
      expect(props.saveThesaurus).toHaveBeenCalledWith(sanitizedThesauri);
    });
  });

  describe('on props update', () => {
    it('should add an empty value at the end of the thesauri and at the end of groups when there is none', () => {
      render();
      instance.firstLoad = false;
      instance.componentDidUpdate(props);

      expect(props.addValue.calls.allArgs()).toEqual([[0], [1], []]);
    });
  });

  describe('componentDidUpdate() when a group is added', () => {
    it('should focus it', () => {
      render();
      props.thesauri = {
        _id: '123',
        name: 'thesauri name',
        values: [{ label: 'Heroes', values: [{ label: 'Batman' }, { label: 'Robin' }] }],
      };
      instance.firstLoad = false;
      instance.groups = [
        { focus: jasmine.createSpy('focus') },
        { focus: jasmine.createSpy('focus') },
      ];
      instance.componentDidUpdate(props);
      expect(instance.groups[1].focus).toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    let state;
    beforeEach(() => {
      state = {
        thesauri: {
          data: { name: 'thesauri name', values: [] },
          state: 'thesauri form state',
        },
        thesauris: Immutable.fromJS([{ name: 'Countries' }]),
      };
    });

    it('should map the thesauri to initialValues', () => {
      expect(mapStateToProps(state).thesauri).toEqual({ name: 'thesauri name', values: [] });
      expect(mapStateToProps(state).thesauris).toEqual(Immutable.fromJS([{ name: 'Countries' }]));
    });
  });

  describe('onChange', () => {
    it('should update values', () => {
      render();
      const values = [{ label: 'item' }];
      instance.onChange(values, 1);
      expect(props.updateValues).toHaveBeenCalledWith(values, 1);
    });
  });

  describe('validation', () => {
    describe('name duplicated', () => {
      let thesauris;
      let id;
      beforeEach(() => {
        thesauris = [
          { _id: 'id1', name: 'Countries' },
          { _id: 'id2', name: 'Cities' },
          { _id: 'id3', name: 'People', type: 'template' },
        ];
        id = 'id1';
      });
      function testValidationResult(inputValue, expectedResult) {
        const {
          name: { duplicated },
        } = ThesauriForm.validation(thesauris, id);
        const res = duplicated(inputValue);
        expect(res).toBe(expectedResult);
      }
      it('should return false if another thesaurus exists with the same name', () => {
        testValidationResult('Cities', false);
      });
      it('should return true if thesaurus with similar name is itself', () => {
        testValidationResult('Countries', true);
      });
      it('should return true if template has same name', () => {
        testValidationResult('People', true);
      });
    });
  });
});
