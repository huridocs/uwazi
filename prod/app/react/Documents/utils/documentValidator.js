"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.required = required;exports.default = void 0;function required(val) {
  return val.trim() !== '';
}var _default =

{
  generate(template) {
    const validationObject = {
      title: { required } };


    template.properties.forEach(property => {
      if (property.required) {
        validationObject[`metadata.${property.name}`] = { required };
      }
    });

    return validationObject;
  } };exports.default = _default;