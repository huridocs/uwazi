import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import NeedAuthorization from 'app/Auth/components/NeedAuthorization';
import { TemplateLabel, SidePanel } from 'app/Layout';
import { SelectMultiplePanel, mapStateToProps } from '../SelectMultiplePanel';

describe('SelectMultiplePanel', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    props = {
      entitiesSelected: Immutable.fromJS([
        { title: 'A rude awakening', template: '1' },
        { title: 'A falling star', template: '2' },
      ]),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      deleteEntities: jasmine.createSpy('deleteEntities'),
      updateSelectedEntities: jasmine.createSpy('updateSelectedEntities'),
      getAndSelectDocument: jasmine.createSpy('getAndSelectDocument'),
      updateEntities: jasmine.createSpy('updateEntities'),
      multipleUpdate: jasmine
        .createSpy('multipleUpdate')
        .and.callFake(async () => Promise.resolve('updated entities')),
      resetForm: jasmine.createSpy('resetForm'),
      loadForm: jasmine.createSpy('resetForm'),
      templates: Immutable.fromJS([]),
      state: { metadata: {} },
      formState: { icon: {}, metadata: {} },
      formKey: 'library.sidepanel.multipleEdit',
      thesauris: Immutable.fromJS([]),
      template: Immutable.fromJS({ properties: [] }),
      storeKey: 'library',
      mainContext: { confirm: jasmine.createSpy('confirm') },
    };
  });

  const render = () => {
    component = shallow(<SelectMultiplePanel {...props} />);
    instance = component.instance();
  };

  it('should render a SidePanel', () => {
    render();
    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBe(false);
  });

  it('should render a list of documents with a TemplateLabel', () => {
    render();
    expect(component.find(TemplateLabel).length).toBe(2);
    expect(component.find('.entities-list li span').first().text()).toContain('A rude awakening');
    expect(component.find('.entities-list li span').last().text()).toContain('A falling star');
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();
      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('close()', () => {
    it('should unselect all the entities and reset the form', () => {
      render();
      component.find('.close-modal').simulate('click');
      expect(props.unselectAllDocuments).toHaveBeenCalled();
      expect(props.resetForm).toHaveBeenCalled();
    });
  });

  describe('delete()', () => {
    it('should confirm before deleting all the selectedEntities', () => {
      render();
      component.find('.delete').simulate('click');
      expect(props.mainContext.confirm).toHaveBeenCalled();
      props.mainContext.confirm.calls.mostRecent().args[0].accept();
      expect(props.deleteEntities).toHaveBeenCalledWith(props.entitiesSelected.toJS());
    });
  });

  describe('changeTemplate()', () => {
    it('should update the template in all the selectedEntities', () => {
      render();
      instance.changeTemplate({}, '3');
      const expectedEntities = [
        { title: 'A rude awakening', template: '3' },
        { title: 'A falling star', template: '3' },
      ];
      const entities = props.updateSelectedEntities.calls.mostRecent().args[0].toJS();
      expect(entities).toEqual(expectedEntities);
    });
  });

  describe('save()', () => {
    it('should update the entities with the modified values and save', done => {
      props.template = Immutable.fromJS({ _id: '4', properties: [] });
      props.formState = {
        icon: { pristine: false },
        metadata: { title: { pristine: false }, date: { pristine: true } },
      };
      render();
      instance
        .save({
          icon: 'doc-icon',
          metadata: { title: [{ value: 'new title' }], date: [{ value: '' }] },
        })
        .then(() => {
          expect(props.multipleUpdate).toHaveBeenCalledWith(props.entitiesSelected, {
            template: '4',
            metadata: { title: [{ value: 'new title' }] },
            icon: 'doc-icon',
          });
          expect(props.updateEntities).toHaveBeenCalledWith('updated entities');
          expect(props.unselectAllDocuments).toHaveBeenCalled();
          expect(props.resetForm).toHaveBeenCalledWith(props.formKey);
          done();
        });
    });
  });

  describe('edit()', () => {
    it('should load the form with the comon properties for the selectedEntities', () => {
      render();
      component.find('.edit').simulate('click');
      expect(props.loadForm).toHaveBeenCalledWith(
        'library.sidepanel.multipleEdit',
        props.template.toJS()
      );
    });
  });

  describe('mapStateToProps', () => {
    let state;
    let ownProps;

    beforeEach(() => {
      state = {};
      ownProps = { state: {} };
      ownProps.templates = Immutable.fromJS([
        {
          _id: '1',
          name: 'first',
          default: true,
          properties: [
            { name: 'year', type: 'numeric' },
            { name: 'powers', content: '1', type: 'multiselect' },
            { name: 'enemies', content: '2', type: 'multiselect' },
            { name: 'color', type: 'text', required: true },
          ],
        },
        {
          _id: '2',
          name: 'last',
          properties: [
            { name: 'year', type: 'date' },
            { name: 'powers', content: '1', type: 'multiselect' },
            { name: 'enemies', content: '3', type: 'multiselect' },
            { name: 'color', type: 'text', required: false },
          ],
        },
      ]);
      ownProps.entitiesSelected = Immutable.fromJS([
        { title: 'A rude awakening', template: '1' },
        { title: 'A falling star', template: '2' },
      ]);
    });

    describe('when templates are diferent', () => {
      it('should return a template with the common properties and a blank template', () => {
        const expectedTemplate = {
          _id: '',
          properties: [
            { name: 'powers', content: '1', type: 'multiselect' },
            { name: 'color', type: 'text', required: true },
          ],
        };
        expect(mapStateToProps(state, ownProps).template.toJS()).toEqual(expectedTemplate);
      });
    });

    describe('when templates are the same', () => {
      it('should return the template', () => {
        ownProps.entitiesSelected = Immutable.fromJS([
          { title: 'A rude awakening', template: '1' },
          { title: 'A falling star', template: '1' },
        ]);
        const expectedTemplate = {
          _id: '1',
          properties: [
            { name: 'year', type: 'numeric' },
            { name: 'powers', content: '1', type: 'multiselect' },
            { name: 'enemies', content: '2', type: 'multiselect' },
            { name: 'color', type: 'text', required: true },
          ],
        };
        expect(mapStateToProps(state, ownProps).template.toJS()).toEqual(expectedTemplate);
      });

      describe('undefined template', () => {
        it('should return the first template', () => {
          ownProps.entitiesSelected = Immutable.fromJS([
            { title: 'A rude awakening' },
            { title: 'A falling star' },
          ]);
          const expectedTemplate = {
            _id: '1',
            name: 'first',
            default: true,
            properties: [
              { name: 'year', type: 'numeric' },
              { name: 'powers', content: '1', type: 'multiselect' },
              { name: 'enemies', content: '2', type: 'multiselect' },
              { name: 'color', type: 'text', required: true },
            ],
          };
          expect(mapStateToProps(state, ownProps).template.toJS()).toEqual(expectedTemplate);
        });
      });
    });
  });

  describe('renderEditingButtons', () => {
    it('should control the access of the user', () => {
      render();
      const authorization = component.find(NeedAuthorization);
      expect(authorization.props().orWriteAccessTo).toEqual([
        { title: 'A rude awakening', template: '1' },
        { title: 'A falling star', template: '2' },
      ]);
      expect(authorization.props().roles).toEqual(['admin', 'editor']);
    });
  });
});
