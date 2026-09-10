/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useWatch } from 'react-hook-form';
import type { Template } from '#app/apiResponseTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import { templatesAtom, userAtom } from '#V2/atoms/index.js';
import { EntityProvider } from '#V2/Routes/Entity/Components/context/EntityContext.js';
import {
  MetadataEditingProvider,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/MetadataEditingContext.js';
import { ServicesProvider } from '#V2/services/index.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import type { EntitiesService } from '#V2/services/index.js';
import { CopyFromModal } from '../CopyFromModal.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';

jest.mock('#V2/Components/Metadata/MetadataRecord.js', () => ({
  MetadataRecord: ({ entity }: { entity: Entity }) => (
    <div data-testid="source-metadata-preview">{entity.title}</div>
  ),
}));

const countryTemplate: Template = {
  _id: 'country',
  name: 'Country',
  color: '#2b8a3e',
  properties: [
    { _id: 'p1', name: 'region', type: 'select', label: 'Region', content: 'c1' },
    { _id: 'p2', name: 'ratified', type: 'numeric', label: 'Ratified ACHR' },
    {
      _id: 'p3',
      name: 'accepts',
      type: 'select',
      label: 'Accepts Court jurisdiction',
      content: 'c2',
    },
  ],
};

const personTemplate: Template = {
  _id: 'person',
  name: 'Person',
  color: '#faca15',
  properties: [{ _id: 'p4', name: 'region', type: 'select', label: 'Region', content: 'c1' }],
};

const mexico: Entity = {
  _id: 'mexico-id',
  sharedId: 'mexico',
  title: 'Mexico',
  template: 'country',
  language: 'en',
  creationDate: 0,
  user: 'user1',
  metadata: {
    region: [{ value: 'north', label: 'North America' }],
    ratified: [{ value: 1981 }],
    accepts: [{ value: 'yes', label: 'Yes' }],
  },
};

const argentina: Entity = {
  _id: 'argentina-id',
  sharedId: 'argentina',
  title: 'Argentina',
  template: 'country',
  language: 'en',
  creationDate: 0,
  user: 'user1',
  metadata: {},
};

const colombia: Entity = {
  _id: 'colombia-id',
  sharedId: 'colombia',
  title: 'Colombia',
  template: 'country',
  language: 'en',
  creationDate: 0,
  user: 'user1',
  metadata: {
    region: [{ value: 'south', label: 'South America' }],
    ratified: [{ value: 1973 }],
    accepts: [{ value: 'yes', label: 'Yes' }],
  },
};

const person: Entity = {
  _id: 'person-id',
  sharedId: 'person-1',
  title: 'Ada Lovelace',
  template: 'person',
  language: 'en',
  creationDate: 0,
  user: 'user1',
  metadata: { region: [{ value: 'south', label: 'South America' }] },
};

const FormProbe = () => {
  const { form } = useMetadataEditing();
  const region = useWatch({ control: form.control, name: 'metadata.region' });
  const ratified = useWatch({ control: form.control, name: 'metadata.ratified' });
  return (
    <div>
      <div data-testid="form-region">{JSON.stringify(region)}</div>
      <div data-testid="form-ratified">{JSON.stringify(ratified)}</div>
    </div>
  );
};

const searchCandidates = jest.fn(
  async ({
    title,
    template,
  }: {
    title?: string;
    template?: string[];
  }): Promise<ApiResponse<Entity[] | undefined>> => {
    const pool = template?.includes('country')
      ? [mexico, argentina, colombia]
      : [mexico, argentina, colombia, person];
    const term = title?.trim().toLowerCase();
    const rows = term ? pool.filter(entity => entity.title.toLowerCase().includes(term)) : pool;
    return [rows];
  }
);

const getBySharedId: EntitiesService['getBySharedId'] = async sharedId => {
  if (sharedId === colombia.sharedId) return [[colombia]];
  if (sharedId === argentina.sharedId) return [[argentina]];
  if (sharedId === person.sharedId) return [[person]];
  return [undefined];
};

const withText = (text: string) => (_content: string, node: Element | null) => {
  const normalized = node?.textContent?.replace(/\s+/g, ' ').trim();
  if (normalized !== text) return false;
  return node?.parentElement?.textContent?.replace(/\s+/g, ' ').trim() !== text;
};

const renderModal = (onClose = jest.fn()) =>
  render(
    <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
      <TestAtomStoreProvider
        initialValues={[
          [templatesAtom, [countryTemplate, personTemplate]],
          [userAtom, { _id: '1', role: 'admin', name: 'admin' }],
        ]}
      >
        <EntityProvider entity={mexico}>
          <MetadataEditingProvider>
            <FormProbe />
            <CopyFromModal onClose={onClose} searchCandidates={searchCandidates} />
          </MetadataEditingProvider>
        </EntityProvider>
      </TestAtomStoreProvider>
    </ServicesProvider>
  );

describe('CopyFromModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists candidates of the current type, excluding the entity being edited', async () => {
    renderModal();
    expect(await screen.findByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Colombia')).toBeInTheDocument();
    expect(screen.queryByText('Mexico')).not.toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(screen.getByText(withText('2 candidates'))).toBeInTheDocument();
    expect(screen.getAllByText(withText('3 fields'))).toHaveLength(2);
    expect(searchCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ template: ['country'] })
    );
  });

  it('searches any type and filters by title', async () => {
    renderModal();
    await screen.findByText('Argentina');
    fireEvent.click(screen.getByRole('button', { name: 'Any type' }));
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(withText('1 field'))).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search by title'), {
      target: { value: 'Colom' },
    });
    await waitFor(() => {
      expect(screen.getByText('Colombia')).toBeInTheDocument();
      expect(screen.queryByText('Argentina')).not.toBeInTheDocument();
    });
  });

  it('previews matching fields and stages them into the form', async () => {
    const onClose = jest.fn();
    renderModal(onClose);
    fireEvent.click(await screen.findByRole('button', { name: 'Colombia' }));
    expect(await screen.findByText(/copy from this entity/i)).toBeInTheDocument();
    expect(screen.getByText(withText('3 fields match'))).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('Ratified ACHR')).toBeInTheDocument();
    expect(screen.getByTestId('source-metadata-preview')).toHaveTextContent('Colombia');
    fireEvent.click(screen.getByRole('button', { name: 'Stage 3 fields' }));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(screen.getByTestId('form-region')).toHaveTextContent('South America');
    expect(screen.getByTestId('form-ratified')).toHaveTextContent('1973');
  });

  it('returns to search from pick another', async () => {
    renderModal();
    fireEvent.click(await screen.findByRole('button', { name: 'Colombia' }));
    expect(await screen.findByText(/copy from this entity/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pick another' }));
    expect(await screen.findByText('Argentina')).toBeInTheDocument();
    expect(screen.queryByText(/copy from this entity/i)).not.toBeInTheDocument();
  });
});
