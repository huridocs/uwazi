"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var redux = _interopRequireWildcard(require("redux"));
var _reactReduxForm = require("react-redux-form");
var _immutable = _interopRequireDefault(require("immutable"));
var _ActivitylogForm = _interopRequireWildcard(require("../ActivitylogForm.js"));
var actions = _interopRequireWildcard(require("../../actions/activitylogActions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('ActivitylogForm', () => {
  let state;
  let props;
  let component;

  beforeEach(() => {
    spyOn(actions, 'activitylogSearch');
    spyOn(actions, 'activitylogSearchMore');
    spyOn(redux, 'bindActionCreators').and.callFake(propsToBind => propsToBind);
    const rows = [
    { time: 8235 },
    { time: 7614 },
    { time: 6613 },
    { time: 6187 },
    { time: 6013 }];

    state = { activitylog: { search: _immutable.default.fromJS({ limit: 5, remainingRows: 7, rows }) } };
  });

  const render = () => {
    props = {};
    const fullProps = Object.assign({}, props, (0, _ActivitylogForm.mapStateToProps)(state), (0, _ActivitylogForm.mapDispatchToProps)());
    component = (0, _enzyme.shallow)(_react.default.createElement(_ActivitylogForm.default.WrappedComponent, fullProps));
  };

  it('should render a form', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should submit the values', () => {
    render();
    component.find(_reactReduxForm.LocalForm).simulate('submit', { limit: 100 });
    expect(component.state().query).toEqual({ limit: 100 });
    expect(actions.activitylogSearch).toHaveBeenCalledWith({ limit: 100 });
  });

  it('should load more values when available', () => {
    render();

    const button = component.find('button');
    expect(button.hasClass('disabled')).toBe(false);

    button.simulate('click');
    expect(actions.activitylogSearchMore).toHaveBeenCalledWith({ before: 6013 });
  });

  it('should not load more values if all are loaded', () => {
    state.activitylog.search = state.activitylog.search.set('remainingRows', 0);

    render();

    const button = component.find('button');
    button.simulate('click');

    expect(actions.activitylogSearchMore).not.toHaveBeenCalled();
    expect(button.hasClass('disabled')).toBe(true);
  });
});