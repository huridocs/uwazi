import React, { type ReactNode } from 'react';
import type { Entity } from '#V2/api/entities/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { EntityProvider } from '../EntityContext.js';
import { MetadataEditingProvider } from '../MetadataEditingContext.js';

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 't1',
  language: 'en',
  metadata: {
    simple_text: [{ value: 'entity-text' }],
    report: [{ value: 'entity-report' }],
  },
  creationDate: 0,
  user: 'user1',
};

const getBySharedId = jest.fn();
const testServices = createTestServices({ entities: { getBySharedId } });

const editingTree = (current: Entity, children: ReactNode) => (
  <ServicesProvider value={testServices}>
    <TestAtomStoreProvider
      initialValues={[[templatesAtom, [{ _id: 't1', name: 'T', properties: [] }]]]}
    >
      <EntityProvider entity={current}>
        <MetadataEditingProvider>{children}</MetadataEditingProvider>
      </EntityProvider>
    </TestAtomStoreProvider>
  </ServicesProvider>
);

const wrapper = ({ children }: { children: ReactNode }) => editingTree(entity, children);

export { editingTree, entity, getBySharedId, wrapper };
