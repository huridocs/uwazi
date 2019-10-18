"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _DropdownList = _interopRequireDefault(require("react-widgets/lib/DropdownList"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class DropdownList extends _DropdownList.default {
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }}exports.default = DropdownList;