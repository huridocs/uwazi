"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.ids = exports.default = void 0;
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-len */

const userId = _testing_db.default.id();

const template1 = _testing_db.default.id();
const template2 = _testing_db.default.id();
const template3 = _testing_db.default.id();
const template4 = _testing_db.default.id();
const template5 = _testing_db.default.id();

const template1Metadata1 = _testing_db.default.id();
const template1Metadata2 = _testing_db.default.id();
const template2Metadata1 = _testing_db.default.id();

const relationType1 = _testing_db.default.id();

const hub1 = _testing_db.default.id();
const hub2 = _testing_db.default.id();
const hub3 = _testing_db.default.id();
const hub4 = _testing_db.default.id();
const hub5 = _testing_db.default.id();
const hub6 = _testing_db.default.id();var _default =

{
  entities: [
  {
    _id: _testing_db.default.id(),
    sharedId: 'entity01',
    template: template1,
    language: 'en',
    title: 'Entity with two geolocations en',
    metadata: {
      home_geolocation: [{ lat: 13, lon: 7, label: '' }],
      work_geolocation: [{ lat: 23, lon: 8, label: '' }] },

    published: true,
    user: userId },
  {
    _id: _testing_db.default.id(),
    sharedId: 'entity02',
    template: template1,
    language: 'en',
    title: 'Entity not always inherited en',
    metadata: {
      home_geolocation: [{ lat: 111, lon: 222, label: '' }],
      work_geolocation: [{ lat: 333, lon: 444, label: '' }] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity03',
    template: template1,
    language: 'en',
    title: 'Entity with single geolocation en',
    metadata: {
      home_geolocation: [{ lat: 5, lon: 10, label: '' }] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity04',
    template: template1,
    language: 'en',
    title: 'Entity without geolocation en',
    metadata: {},
    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity04.1',
    template: template1,
    language: 'en',
    title: 'entity without metadata',
    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity05',
    template: template2,
    language: 'en',
    title: 'Country A en',
    metadata: {
      country_geolocation: [{ lat: 23, lon: 7, label: '' }] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity06',
    template: template2,
    language: 'en',
    title: 'Country A en',
    metadata: {
      country_geolocation: [null] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entityPrivate01',
    template: template2,
    language: 'en',
    title: 'Country A en',
    metadata: {
      country_geolocation: [{ lat: 24, lon: 8, label: '' }] },

    published: false,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity07',
    template: template3,
    language: 'en',
    title: 'Complex inherited entity en',
    metadata: {
      text: 'Text content',
      regular_geolocation_geolocation: [{ lat: 18, lon: 7 }],
      regular_relationship: ['entity02'],
      inhertied_country: ['entity06'],
      inhertied_home: ['entity01', 'entity03', 'entity04', 'entity04.1'] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity08',
    template: template3,
    language: 'en',
    title: 'Simple inherited entity en',
    metadata: {
      text: 'Text content',
      inhertied_home: ['entity02', 'noExiste'] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity_isLinkedToPrivateEntity',
    template: template3,
    language: 'en',
    title: 'Inheriting private country',
    metadata: {
      text: 'Text content',
      null_geolocation_geolocation: null,
      inhertied_country: ['entityPrivate01'] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity_shouldNotAppearInGeolocation',
    template: template3,
    language: 'en',
    title: 'Entity that should not appear in geolocation searches en',
    metadata: {},
    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity09',
    template: template4,
    language: 'en',
    title: 'Entity with other property inherited en',
    metadata: {
      text: 'Text content',
      inhertied_work: ['entity01'] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity10',
    template: template4,
    language: 'en',
    title: 'Entity linking a null en',
    metadata: {
      inhertied_work: ['entity06'] },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    sharedId: 'entity011',
    template: template5,
    language: 'en',
    title: 'Entity without geolocations en',
    metadata: {
      just_text: 'Text content' },

    published: true,
    user: userId },

  {
    _id: _testing_db.default.id(),
    template: template5,
    sharedId: 'entityWithoutMetadata',
    title: 'Entity without metadata' }],


  templates: [
  {
    _id: template1,
    properties: [
    { _id: _testing_db.default.id(), name: 'text', type: 'text' },
    {
      _id: template1Metadata1,
      name: 'home_geolocation',
      type: 'geolocation' },

    {
      _id: template1Metadata2,
      name: 'work_geolocation',
      type: 'geolocation' }] },



  {
    _id: template2,
    properties: [
    {
      _id: template2Metadata1,
      name: 'country_geolocation',
      type: 'geolocation' }] },



  {
    _id: template3,
    properties: [
    { _id: _testing_db.default.id(), name: 'text', type: 'text' },
    {
      _id: _testing_db.default.id(),
      name: 'null_geolocation_geolocation',
      type: 'geolocation' },

    {
      _id: _testing_db.default.id(),
      name: 'regular_geolocation_geolocation',
      type: 'geolocation' },

    {
      _id: _testing_db.default.id(),
      name: 'regular_relationship',
      type: 'relationship',
      relationType: relationType1 },

    {
      _id: _testing_db.default.id(),
      name: 'inhertied_country',
      type: 'relationship',
      relationType: relationType1,
      content: template2,
      inherit: true,
      inheritProperty: template2Metadata1 },

    {
      _id: _testing_db.default.id(),
      name: 'inhertied_home',
      type: 'relationship',
      relationType: relationType1,
      content: template1,
      inherit: true,
      inheritProperty: template1Metadata1 }] },



  {
    _id: template4,
    properties: [
    {
      _id: _testing_db.default.id(),
      name: 'inhertied_work',
      type: 'relationship',
      relationType: relationType1,
      content: template1,
      inherit: true,
      inheritProperty: template1Metadata2 }] },



  {
    _id: template5,
    properties: [{ _id: _testing_db.default.id(), name: 'just_text', type: 'text' }] }],


  relationtypes: [
  {
    _id: relationType1,
    name: 'relation1',
    properties: [] }],


  connections: [
  { hub: hub1, entity: 'entity07', template: relationType1 },
  { hub: hub1, entity: 'entity02', template: relationType1 },

  { hub: hub2, entity: 'entity07', template: relationType1 },
  { hub: hub2, entity: 'entity06', template: relationType1 },

  { hub: hub3, entity: 'entity07', template: relationType1 },
  { hub: hub3, entity: 'entity01', template: relationType1 },
  { hub: hub3, entity: 'entity03', template: relationType1 },
  { hub: hub3, entity: 'entity04', template: relationType1 },

  { hub: hub4, entity: 'entity08', template: relationType1 },
  { hub: hub4, entity: 'entity02', template: relationType1 },

  { hub: hub5, entity: 'entity09', template: relationType1 },
  { hub: hub5, entity: 'entity01', template: relationType1 },

  { hub: hub6, entity: 'entity10', template: relationType1 },
  { hub: hub6, entity: 'entity06', template: relationType1 }] };exports.default = _default;



const ids = {
  template3,
  template5 };exports.ids = ids;