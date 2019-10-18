"use strict";var _react = _interopRequireDefault(require("react"));

var _enzyme = require("enzyme");
var _RelationTypesAPI = _interopRequireDefault(require("../../RelationTypes/RelationTypesAPI"));
var _prioritySortingCriteria = _interopRequireDefault(require("../../utils/prioritySortingCriteria"));
var relationships = _interopRequireWildcard(require("../../Relationships/utils/routeUtils"));

var _RequestParams = require("../../utils/RequestParams");
var _EntitiesAPI = _interopRequireDefault(require("../EntitiesAPI"));
var _EntityView = _interopRequireDefault(require("../EntityView"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('EntityView', () => {
  describe('requestState', () => {
    const entities = [{ _id: 1, sharedId: 'sid' }];
    const relationTypes = [{ _id: 1, name: 'against' }];

    beforeEach(() => {
      spyOn(_EntitiesAPI.default, 'get').and.returnValue(Promise.resolve(entities));
      spyOn(_RelationTypesAPI.default, 'get').and.returnValue(Promise.resolve(relationTypes));
      spyOn(_prioritySortingCriteria.default, 'get').and.returnValue({ sort: 'priorized' });
      spyOn(relationships, 'requestState').and.returnValue(Promise.resolve(['connectionsGroups', 'searchResults', 'sort', 'filters']));
      spyOn(relationships, 'emptyState').and.returnValue({ type: 'RELATIONSHIPS_EMPTY_STATE' });
      spyOn(relationships, 'setReduxState').and.returnValue({ type: 'RELATIONSHIPS_SET_REDUX_STATE' });
    });

    it('should get the entity, and all connectionsList items', async () => {
      const request = new _RequestParams.RequestParams({ sharedId: '123' }, 'headers');
      const actions = await _EntityView.default.requestState(request, { templates: 'templates' });

      expect(relationships.requestState).toHaveBeenCalledWith(request, { templates: 'templates' });
      expect(_EntitiesAPI.default.get).toHaveBeenCalledWith(request);
      expect(_RelationTypesAPI.default.get).toHaveBeenCalledWith({ headers: 'headers' });

      expect(actions).toMatchSnapshot();
    });

    describe('componentWillUnmount()', () => {
      it('should unset the state', () => {
        const context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
        const component = (0, _enzyme.shallow)(_jsx(_EntityView.default, { params: { entityId: 123 } }), { context });
        component.instance().componentWillUnmount();
        expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'entityView/entity/UNSET' });
        expect(context.store.dispatch).toHaveBeenCalledWith({ type: 'RELATIONSHIPS_EMPTY_STATE' });
      });
    });
  });
});