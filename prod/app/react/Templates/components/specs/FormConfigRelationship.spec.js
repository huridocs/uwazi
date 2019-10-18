"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _FormConfigRelationship = require("../FormConfigRelationship");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FormConfigRelationship', () => {
  let component;
  let templates;
  let relationTypes;
  let props;

  beforeEach(() => {
    templates = [{ _id: 3, name: 'Judge', type: 'template', properties: [] }];
    relationTypes = [{ _id: 1, name: 'relationType1' }, { _id: 2, name: 'relationType2' }];
    props = {
      templates: _immutable.default.fromJS(templates),
      relationTypes: _immutable.default.fromJS(relationTypes),
      index: 0,
      type: 'relationship',
      data: { properties: [{ filter: false }] },
      formState: {
        'properties.0.label': { valid: true, dirty: false, errors: {} },
        properties: [
        { content: { value: 3 } }],

        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false } } } };




  });

  it('should render fields with the correct datas', () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigRelationship.FormConfigRelationship, props));
    expect(component).toMatchSnapshot();
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState['properties.0.label'].touched = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigRelationship.FormConfigRelationship, props));
      expect(component).toMatchSnapshot();
    });

    it('should render the label with errors when the form is submited', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigRelationship.FormConfigRelationship, props));
      expect(component).toMatchSnapshot();
    });
  });

  describe('when use as filter is selected', () => {
    it('should show the default filter option', () => {
      props.data.properties[0].filter = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_FormConfigRelationship.FormConfigRelationship, props));
      expect(component).toMatchSnapshot();
    });
  });
});