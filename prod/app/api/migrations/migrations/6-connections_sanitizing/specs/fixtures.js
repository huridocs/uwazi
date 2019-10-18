"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.shared6 = exports.shared5 = exports.shared4 = exports.shared3 = exports.shared2 = exports.shared1 = exports.hub3 = exports.hub2 = exports.hub1 = exports.default = void 0;var _testing_db = _interopRequireDefault(require("../../../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const hub1 = _testing_db.default.id().toString();exports.hub1 = hub1;
const hub2 = _testing_db.default.id().toString();exports.hub2 = hub2;
const hub3 = _testing_db.default.id().toString();exports.hub3 = hub3;

const template1 = _testing_db.default.id().toString();
const template2 = _testing_db.default.id().toString();

const shared1 = _testing_db.default.id().toString();exports.shared1 = shared1;
const shared2 = _testing_db.default.id().toString();exports.shared2 = shared2;
const shared3 = _testing_db.default.id().toString();exports.shared3 = shared3;
const shared4 = _testing_db.default.id().toString();exports.shared4 = shared4;
const shared5 = _testing_db.default.id().toString();exports.shared5 = shared5;
const shared6 = _testing_db.default.id().toString();exports.shared6 = shared6;
const shared7 = _testing_db.default.id().toString();var _default =

{
  settings: [{
    languages: [
    {
      key: 'es',
      label: 'Español',
      default: true },

    {
      key: 'en',
      label: 'English' },

    {
      key: 'pt',
      label: 'Português' }] }],



  connections: [
  // Good connections
  {
    entity: 'connectedEntity1',
    hub: hub1,
    template: template1,
    language: 'pt',
    sharedId: shared1 },

  {
    entity: 'connectedEntity1',
    hub: hub1,
    template: template1,
    language: 'es',
    sharedId: shared1 },

  {
    entity: 'connectedEntity1',
    hub: hub1,
    template: template1,
    language: 'en',
    sharedId: shared1 },

  {
    entity: 'connectedEntity2',
    hub: hub1,
    template: template1,
    language: 'pt',
    sharedId: 'shared7' },

  {
    entity: 'connectedEntity2',
    hub: hub1,
    template: template1,
    language: 'es',
    sharedId: 'shared7' },

  {
    entity: 'connectedEntity2',
    hub: hub1,
    template: template1,
    language: 'en',
    sharedId: 'shared7' },

  // Incomplete connection
  {
    entity: 'anotherEntity',
    hub: hub1,
    template: template2,
    language: 'es',
    sharedId: shared2 },

  {
    entity: 'anotherEntity',
    hub: hub1,
    template: template2,
    language: 'en',
    sharedId: shared2 },

  // Residual connections
  {
    entity: 'someDocument',
    hub: hub1,
    template: template1,
    language: 'pt',
    sharedId: shared3 },

  {
    entity: 'someDocument',
    hub: hub1,
    template: template1,
    language: 'en',
    sharedId: shared3 },

  // Text connections of only 2 docs (valid)
  {
    entity: 'textReferencedDocument',
    hub: hub2,
    template: template1,
    language: 'pt',
    sharedId: shared4,
    range: { text: 'some text' } },

  {
    entity: 'textReferencedDocument',
    hub: hub2,
    template: template1,
    language: 'en',
    sharedId: shared4,
    range: { text: 'some text' } },

  // Good connection
  {
    entity: 'connectedEntity3',
    hub: hub2,
    template: template1,
    language: 'pt',
    sharedId: shared5 },

  {
    entity: 'connectedEntity3',
    hub: hub2,
    template: template1,
    language: 'es',
    sharedId: shared5 },

  {
    entity: 'connectedEntity3',
    hub: hub2,
    template: template1,
    language: 'en',
    sharedId: shared5 },

  // Good connection of single-connection hub (after deletion)
  {
    entity: 'connectedEntity',
    hub: hub3,
    template: template1,
    language: 'pt',
    sharedId: shared6 },

  {
    entity: 'connectedEntity',
    hub: hub3,
    template: template1,
    language: 'es',
    sharedId: shared6 },

  {
    entity: 'connectedEntity',
    hub: hub3,
    template: template1,
    language: 'en',
    sharedId: shared6 },

  {
    entity: 'connectedEntity',
    hub: hub3,
    template: template1,
    language: 'en',
    sharedId: shared7 }] };exports.default = _default;