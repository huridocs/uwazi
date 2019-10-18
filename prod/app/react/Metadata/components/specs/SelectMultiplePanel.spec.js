"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));
var _Layout = require("../../../Layout");
var _SelectMultiplePanel = require("../SelectMultiplePanel");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SelectMultiplePanel', () => {
  let component;
  let instance;
  let props;
  let context;

  beforeEach(() => {
    props = {
      entitiesSelected: _immutable.default.fromJS([{ title: 'A rude awakening', template: '1' }, { title: 'A falling star', template: '2' }]),
      unselectAllDocuments: jasmine.createSpy('unselectAllDocuments'),
      deleteEntities: jasmine.createSpy('deleteEntities'),
      updateSelectedEntities: jasmine.createSpy('updateSelectedEntities'),
      getAndSelectDocument: jasmine.createSpy('getAndSelectDocument'),
      updateEntities: jasmine.createSpy('updateEntities'),
      multipleUpdate: jasmine.createSpy('multipleUpdate').and.returnValue(Promise.resolve('updated entities')),
      resetForm: jasmine.createSpy('resetForm'),
      loadForm: jasmine.createSpy('resetForm'),
      templates: _immutable.default.fromJS([]),
      state: { metadata: {} },
      formState: { icon: {}, metadata: {} },
      formKey: 'library.sidepanel.multipleEdit',
      thesauris: _immutable.default.fromJS([]),
      template: _immutable.default.fromJS({ properties: [] }) };

    context = { confirm: jasmine.createSpy('confirm') };
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_SelectMultiplePanel.SelectMultiplePanel, props), { context });
    instance = component.instance();
  };

  it('should render a SidePanel', () => {
    render();
    expect(component.find(_Layout.SidePanel).length).toBe(1);
    expect(component.find(_Layout.SidePanel).props().open).toBe(false);
  });

  it('should render a list of documents with a TemplateLabel', () => {
    render();
    expect(component.find(_Layout.TemplateLabel).length).toBe(2);
    expect(component.find('.entities-list li span').first().text()).toBe('A rude awakening');
    expect(component.find('.entities-list li span').last().text()).toBe('A falling star');
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();
      expect(component.find(_Layout.SidePanel).props().open).toBe(true);
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
      expect(context.confirm).toHaveBeenCalled();
      context.confirm.calls.mostRecent().args[0].accept();
      expect(props.deleteEntities).toHaveBeenCalledWith(props.entitiesSelected.toJS());
    });
  });

  describe('changeTemplate()', () => {
    it('should update the template in all the selectedEntities', () => {
      render();
      instance.changeTemplate({}, '3');
      const expectedEntities = [{ title: 'A rude awakening', template: '3' }, { title: 'A falling star', template: '3' }];
      const entities = props.updateSelectedEntities.calls.mostRecent().args[0].toJS();
      expect(entities).toEqual(expectedEntities);
    });
  });

  describe('save()', () => {
    it('should update the entities with the modified values and save', done => {
      props.template = _immutable.default.fromJS({ _id: '4', properties: [] });
      props.formState = {
        icon: { pristine: false },
        metadata: {
          title: { pristine: false },
          date: { pristine: true } } };


      render();
      instance.save({ icon: 'doc-icon', metadata: { title: 'new title', date: '' } }).
      then(() => {
        expect(props.multipleUpdate).
        toHaveBeenCalledWith(props.entitiesSelected, { template: '4', metadata: { title: 'new title' }, icon: 'doc-icon' });
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
      expect(props.loadForm).toHaveBeenCalledWith('library.sidepanel.multipleEdit', props.template.toJS());
    });
  });

  describe('mapStateToProps', () => {
    let state;
    let ownProps;

    beforeEach(() => {
      state = {};
      ownProps = { state: {} };
      ownProps.templates = _immutable.default.fromJS([
      {
        _id: '1',
        name: 'first',
        default: true,
        properties: [
        { name: 'year', type: 'numeric' },
        { name: 'powers', content: '1', type: 'multiselect' },
        { name: 'enemies', content: '2', type: 'multiselect' },
        { name: 'color', type: 'text', required: true }] },


      {
        _id: '2',
        name: 'last',
        properties: [
        { name: 'year', type: 'date' },
        { name: 'powers', content: '1', type: 'multiselect' },
        { name: 'enemies', content: '3', type: 'multiselect' },
        { name: 'color', type: 'text', required: false }] }]);



      ownProps.entitiesSelected = _immutable.default.fromJS([{ title: 'A rude awakening', template: '1' }, { title: 'A falling star', template: '2' }]);
    });

    describe('when templates are diferent', () => {
      it('should return a template with the common properties and a blank template', () => {
        const expectedTemplate = {
          _id: '',
          properties: [
          { name: 'powers', content: '1', type: 'multiselect' },
          { name: 'color', type: 'text', required: true }] };


        expect((0, _SelectMultiplePanel.mapStateToProps)(state, ownProps).template.toJS()).toEqual(expectedTemplate);
      });
    });

    describe('when templates are the same', () => {
      it('should return the template', () => {
        ownProps.entitiesSelected = _immutable.default.fromJS([{ title: 'A rude awakening', template: '1' }, { title: 'A falling star', template: '1' }]);
        const expectedTemplate = {
          _id: '1',
          properties: [
          { name: 'year', type: 'numeric' },
          { name: 'powers', content: '1', type: 'multiselect' },
          { name: 'enemies', content: '2', type: 'multiselect' },
          { name: 'color', type: 'text', required: true }] };


        expect((0, _SelectMultiplePanel.mapStateToProps)(state, ownProps).template.toJS()).toEqual(expectedTemplate);
      });

      describe('undefined template', () => {
        it('should return the first template', () => {
          ownProps.entitiesSelected = _immutable.default.fromJS([{ title: 'A rude awakening' }, { title: 'A falling star' }]);
          const expectedTemplate = {
            _id: '1',
            name: 'first',
            default: true,
            properties: [
            { name: 'year', type: 'numeric' },
            { name: 'powers', content: '1', type: 'multiselect' },
            { name: 'enemies', content: '2', type: 'multiselect' },
            { name: 'color', type: 'text', required: true }] };


          expect((0, _SelectMultiplePanel.mapStateToProps)(state, ownProps).template.toJS()).toEqual(expectedTemplate);
        });
      });
    });
  });
});