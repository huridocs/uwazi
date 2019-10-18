"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _default = {
  entities: [
  { sharedId: 'entity1', title: 'test_doc1' },
  { sharedId: 'entity2', title: 'test_doc2' }],

  connections: [
  { entity: 'entity1' },
  { entity: 'entity2' },
  { entity: 'non_existent' },
  { entity: 'non_existent2' }] };exports.default = _default;