"use strict";var _react = _interopRequireDefault(require("react"));

var _timelineFixedData = require("../../../Timeline/utils/timelineFixedData");
var _enzyme = require("enzyme");

var _ShowMetadata = require("../ShowMetadata");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('Metadata', () => {
  let props;

  beforeEach(() => {
    props = {
      entity: {} };

  });

  it('should render without timeline by default', () => {
    props.entity = {};

    const component = (0, _enzyme.shallow)(_react.default.createElement(_ShowMetadata.ShowMetadata, props));
    expect(component).toMatchSnapshot();
  });

  it('should render templateType when showType', () => {
    props.showType = true;
    const component = (0, _enzyme.shallow)(_react.default.createElement(_ShowMetadata.ShowMetadata, props)).find('.item-info');
    expect(component).toMatchSnapshot();
  });

  it('should render title and templateType when and showTitle', () => {
    props.showTitle = true;
    const component = (0, _enzyme.shallow)(_react.default.createElement(_ShowMetadata.ShowMetadata, props)).find('.item-info');
    expect(component).toMatchSnapshot();
  });

  it('should render cejil timeline when template is cejils timeline configured templates', () => {
    props.entity = {
      template: _timelineFixedData.caseTemplate };


    let component = (0, _enzyme.shallow)(_react.default.createElement(_ShowMetadata.ShowMetadata, props)).find('.metadata-timeline-viewer');
    expect(component).toMatchSnapshot();

    props.entity = {
      template: _timelineFixedData.matterTemplate };


    component = (0, _enzyme.shallow)(_react.default.createElement(_ShowMetadata.ShowMetadata, props)).find('.metadata-timeline-viewer');
    expect(component).toMatchSnapshot();
  });
});