/** @jest-environment jsdom */
import React, { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ApiError } from '#shared/apiClient/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import type {
  RelationshipQueryPayload,
  RelationshipSummaryRow,
} from '#V2/api/relationships/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import {
  EntityScopedProvider,
  useEnsureResolved,
  useRelationshipHubRows,
  useRelationshipQueryStatus,
} from '#V2/Routes/Entity/Components/context/index.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { entityWithRelations } from '../../relationships/specs/fixtures/entityWithRelations.js';
import {
  relationshipQueryFromEntity,
  resolvedFromEntity,
} from '../../relationships/specs/helpers/relationshipQueryFromEntity.js';

const mainDocument: FileType = { _id: 'f1', filename: 'doc.pdf' };
const extraRow: RelationshipSummaryRow = {
  _id: 'c-new',
  hub: 'h-new',
  entity: 'new-entity',
  template: null,
  entityData: { title: 'New Entity', template: 'template1' },
};

const useQuery = () => ({
  hubRows: useRelationshipHubRows(),
  status: useRelationshipQueryStatus(),
  ensureResolved: useEnsureResolved(),
});

type Harness = {
  seed?: RelationshipQueryPayload;
  language: string;
  mainDocument?: FileType;
};

const renderQuery = (
  harness: Harness,
  relationshipsQuery: {
    getSummary: jest.Mock;
    getAnchors: jest.Mock;
    getResolved: jest.Mock;
  }
) => {
  const services = createTestServices({ relationshipsQuery });
  return renderHook(useQuery, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MemoryRouter>
        <TestAtomStoreProvider
          initialValues={[
            [templatesAtom, [{ _id: 'template1', name: 'Entity', properties: [] }]],
            [
              settingsAtom,
              {
                languages: [
                  { key: 'en', label: 'English', default: true },
                  { key: 'es', label: 'Spanish' },
                ],
              },
            ],
          ]}
        >
          <ServicesProvider value={services}>
            <EntityScopedProvider
              entity={entityWithRelations}
              language={harness.language}
              mainDocument={harness.mainDocument}
              relationshipQuery={harness.seed}
            >
              {children}
            </EntityScopedProvider>
          </ServicesProvider>
        </TestAtomStoreProvider>
      </MemoryRouter>
    ),
  });
};

describe('RelationshipsQueryProvider', () => {
  const seed = relationshipQueryFromEntity(entityWithRelations, mainDocument._id);
  const revalidatedSeed: RelationshipQueryPayload = {
    ...seed,
    summary: [...seed.summary, extraRow],
  };
  const resolved = resolvedFromEntity(entityWithRelations);

  let getSummary: jest.Mock;
  let getAnchors: jest.Mock;
  let getResolved: jest.Mock;

  beforeEach(() => {
    getSummary = jest.fn().mockResolvedValue([seed.summary]);
    getAnchors = jest.fn().mockResolvedValue([seed.anchors]);
    getResolved = jest.fn().mockResolvedValue([resolved]);
  });

  it('replaces same-key revalidated seed and coalesces getResolved', async () => {
    const harness: Harness = { seed, language: 'en', mainDocument };
    const { result, rerender } = renderQuery(harness, { getSummary, getAnchors, getResolved });

    await act(async () => {
      await Promise.all([result.current.ensureResolved(), result.current.ensureResolved()]);
    });

    expect(getResolved).toHaveBeenCalledTimes(1);
    expect(getSummary).not.toHaveBeenCalled();
    expect(getAnchors).not.toHaveBeenCalled();
    expect(result.current.status.resolved).toBe(true);
    expect(result.current.hubRows.some(row => row.reference?.text)).toBe(true);

    harness.seed = revalidatedSeed;
    rerender();

    expect(getSummary).not.toHaveBeenCalled();
    expect(getAnchors).not.toHaveBeenCalled();
    expect(getResolved).toHaveBeenCalledTimes(1);
    expect(result.current.status.resolved).toBe(false);
    expect(result.current.hubRows.map(row => row._id)).toContain('c-new');
    expect(result.current.hubRows.some(row => row.reference?.text)).toBe(false);
  });

  it('fetches summary and anchors when UI language does not match seed', async () => {
    const harness: Harness = { seed, language: 'es', mainDocument };
    renderQuery(harness, { getSummary, getAnchors, getResolved });

    await waitFor(() => {
      expect(getSummary).toHaveBeenCalledWith('shared1', { language: 'es' });
    });
    expect(getAnchors).toHaveBeenCalledWith('shared1', 'f1', { language: 'es' });
    expect(getResolved).not.toHaveBeenCalled();
  });

  it('retries getResolved after a failed fetch', async () => {
    const error = new ApiError('Server error', { kind: 'http', status: 500 });
    getResolved.mockResolvedValueOnce([undefined, error]).mockResolvedValueOnce([resolved]);
    const harness: Harness = { seed, language: 'en', mainDocument };
    const { result } = renderQuery(harness, { getSummary, getAnchors, getResolved });

    await act(async () => {
      await result.current.ensureResolved();
    });
    expect(result.current.status.resolved).toBe(false);

    await act(async () => {
      await result.current.ensureResolved();
    });
    expect(getResolved).toHaveBeenCalledTimes(2);
    expect(result.current.status.resolved).toBe(true);
  });
});
