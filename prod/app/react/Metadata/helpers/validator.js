"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.notEmpty = notEmpty;exports.default = void 0;function _typeof(obj) {if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {_typeof = function (obj) {return typeof obj;};} else {_typeof = function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;};}return _typeof(obj);}function notEmpty(val) {
  if (Array.isArray(val)) {
    return Boolean(val.length);
  }
  if (typeof val === 'number') {
    return true;
  }

  if (_typeof(val) === 'object' && val !== null) {
    return Boolean(Object.keys(val).length);
  }
  return !!val && val.trim() !== '';
}var _default =

{
  generate(template, noTitle = false) {
    const validationObject = {
      title: { required: notEmpty } };


    if (noTitle) {
      delete validationObject.title;
    }

    template.properties.forEach(property => {
      if (property.required) {
        validationObject[`metadata.${property.name}`] = { required: notEmpty };
      }
    });

    return validationObject;
  } };exports.default = _default;