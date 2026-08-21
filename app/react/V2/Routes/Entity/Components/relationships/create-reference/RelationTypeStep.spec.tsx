/**
 * @jest-environment jsdom
 */

import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider, useAtomValue } from 'jotai';
import type { ClientUserSchema } from '#app/apiResponseTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import { relationshipTypesAtom, templatesAtom, userAtom } from '#V2/atoms/index.js';
import { ServicesProvider } from '#V2/services/index.js';
import { createTestingServices } from '#V2/testing/createTestingServices.js';
import { RelationTypeStep } from './RelationTypeStep.js';

const adminUser: ClientUserSchema = {
  _id: '1',
  role: 'admin',
  username: 'admin',
  email: 'admin@example.com',
};

const editorUser: ClientUserSchema = {
  _id: '2',
  role: 'editor',
  username: 'editor',
  email: 'editor@example.com',
};

const selectedEntity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Target entity',
  language: 'en',
  template: 't1',
  creationDate: 0,
  user: 'user1',
  metadata: {},
};

const existingTypes = [{ _id: 'related', name: 'related to' }];

const RelationTypeHarness = () => {
  const types = useAtomValue(relationshipTypesAtom);
  const [selected, setSelected] = useState<string>();
  return (
    <RelationTypeStep
      selectedEntity={selectedEntity}
      selectedFile={undefined}
      relationshipTypes={types}
      selectedRelationshipType={selected}
      isSaving={false}
      onBack={jest.fn()}
      onRelationshipTypeSelect={setSelected}
      onContinueToTargetText={jest.fn()}
      onCreate={jest.fn()}
    />
  );
};

const renderRelationTypeStep = ({
  types = [],
  user = adminUser,
}: {
  types?: { _id: string; name: string }[];
  user?: ClientUserSchema;
} = {}) => {
  const store = createStore();
  store.set(userAtom, user);
  store.set(relationshipTypesAtom, types);
  store.set(templatesAtom, [{ _id: 't1', name: 'Entity' }]);
  const { services } = createTestingServices({ initialRelationshipTypes: types });

  render(
    <Provider store={store}>
      <ServicesProvider value={services}>
        <RelationTypeHarness />
      </ServicesProvider>
    </Provider>
  );
};

describe('RelationTypeStep', () => {
  it('shows admin empty copy and always-visible add field', async () => {
    const user = userEvent.setup();
    renderRelationTypeStep();

    expect(screen.getByText('No relationship types')).toBeInTheDocument();
    expect(screen.getByText('Create a type to continue.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New relation type label…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create relationship' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Create new relationship type' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('New relation type label…'), 'Custom');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Custom' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
    expect(screen.getByRole('button', { name: 'Create relationship' })).toBeEnabled();
    expect(screen.getByPlaceholderText('New relation type label…')).toHaveValue('');
  });

  it('shows the add field for admin when types already exist', () => {
    renderRelationTypeStep({ types: existingTypes });

    expect(screen.getByPlaceholderText('New relation type label…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'related to' })).toBeInTheDocument();
    expect(screen.queryByText('No relationship types')).not.toBeInTheDocument();
  });

  it('shows editor empty copy without the add field', () => {
    renderRelationTypeStep({ user: editorUser });

    expect(screen.getByText('No relationship types')).toBeInTheDocument();
    expect(
      screen.getByText(
        'An admin needs to add relationship types before you can create a relationship.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('New relation type label…')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });

  it('hides the add field for editors when types exist', () => {
    renderRelationTypeStep({ types: existingTypes, user: editorUser });

    expect(screen.getByRole('button', { name: 'related to' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('New relation type label…')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
  });
});
