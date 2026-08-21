/** @jest-environment jsdom */
import React, { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ApiError } from '#shared/apiClient/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import type { RelationshipHubRow, RelationshipQueryPayload } from '#V2/api/relationships/types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import {
  EntityScopedProvider,
  useEnsureAnchors,
  useEnsureResolved,
  useRelationshipQueryStatus,
  useDirectedRelationships,
} from '#V2/Routes/Entity/Components/context/index.js';
import type { DirectedRelationship } from '#V2/formatters/relationships/types.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { entityWithRelations } from '../../relationships/specs/fixtures/entityWithRelations.js';
import {
  relationshipQueryFromEntity,
  relationshipResolvedFromEntity,
} from '../../relationships/specs/helpers/relationshipQueryFromEntity.js';

const mainDocument: FileType = { _id: 'f1', filename: 'doc.pdf' };
const extraHubRows: RelationshipHubRow[] = [
  {
    _id: 'c-self-new',
    hub: 'h-new',
    entity: 'shared1',
    template: null,
    entityData: { title: 'Source', template: 'template1' },
  },
  {
    _id: 'c-new',
    hub: 'h-new',
    entity: 'new-entity',
    template: null,
    entityData: { title: 'New Entity', template: 'template1' },
  },
];

const useQuery = () => ({
  relationships: useDirectedRelationships(),
  status: useRelationshipQueryStatus(),
  ensureAnchors: useEnsureAnchors(),
  ensureResolved: useEnsureResolved(),
});

type Harness = {
  seed?: RelationshipQueryPayload;
  language: string;
  mainDocument?: FileType;
};

const hasQuoteText = (relationships: readonly DirectedRelationship[]) =>
  relationships.some(
    relationship =>
      (relationship.from.type === 'textReference' && Boolean(relationship.from.text)) ||
      (relationship.to.type === 'textReference' && Boolean(relationship.to.text))
  );

type QueryMocks = {
  loadSummary: jest.Mock;
  loadAnchors: jest.Mock;
  loadResolved: jest.Mock;
};

const renderQuery = (harness: Harness, relationshipsQuery: QueryMocks) => {
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
    hubRows: [...seed.hubRows, ...extraHubRows],
  };
  const resolved = relationshipResolvedFromEntity(entityWithRelations);

  let loadSummary: jest.Mock;
  let loadAnchors: jest.Mock;
  let loadResolved: jest.Mock;

  beforeEach(() => {
    loadSummary = jest.fn().mockResolvedValue([seed.hubRows]);
    loadAnchors = jest.fn().mockResolvedValue([[]]);
    loadResolved = jest.fn().mockResolvedValue([resolved]);
  });

  const mocks = (): QueryMocks => ({ loadSummary, loadAnchors, loadResolved });

  it('replaces same-key revalidated seed and coalesces loadResolved', async () => {
    const harness: Harness = { seed, language: 'en', mainDocument };
    const { result, rerender } = renderQuery(harness, mocks());

    await act(async () => {
      await Promise.all([result.current.ensureResolved(), result.current.ensureResolved()]);
    });

    expect(loadResolved).toHaveBeenCalledTimes(1);
    expect(loadSummary).not.toHaveBeenCalled();
    expect(result.current.status.resolved).toBe(true);
    expect(hasQuoteText(result.current.relationships)).toBe(true);

    harness.seed = revalidatedSeed;
    rerender();

    expect(loadSummary).not.toHaveBeenCalled();
    expect(loadResolved).toHaveBeenCalledTimes(1);
    expect(result.current.status.resolved).toBe(false);
    expect(
      result.current.relationships.some(relationship => relationship.to.entity === 'new-entity')
    ).toBe(true);
    expect(hasQuoteText(result.current.relationships)).toBe(false);
  });

  it('loads summary only when UI language does not match seed', async () => {
    const harness: Harness = { seed, language: 'es', mainDocument };
    renderQuery(harness, mocks());

    await waitFor(() => {
      expect(loadSummary).toHaveBeenCalledWith('shared1', { language: 'es' });
    });
    expect(loadAnchors).not.toHaveBeenCalled();
    expect(loadResolved).not.toHaveBeenCalled();
  });

  it('loads summary and anchors together when rail is needed on a seed miss', async () => {
    let resolveSummary: (value: [RelationshipHubRow[]]) => void = () => undefined;
    loadSummary.mockImplementation(
      async () =>
        new Promise<[RelationshipHubRow[]]>(resolve => {
          resolveSummary = resolve;
        })
    );
    const harness: Harness = { seed, language: 'es', mainDocument };
    const { result } = renderQuery(harness, mocks());

    await act(async () => {
      const pending = result.current.ensureAnchors();
      expect(loadAnchors).toHaveBeenCalledWith('shared1', { language: 'es', fileId: 'f1' });
      resolveSummary([seed.hubRows]);
      await pending;
    });

    expect(loadSummary).toHaveBeenCalledWith('shared1', { language: 'es' });
    expect(loadSummary).toHaveBeenCalledTimes(1);
    expect(loadResolved).not.toHaveBeenCalled();
  });

  it('loads anchors onto a summary-only seed without refetching summary', async () => {
    const summarySeed: RelationshipQueryPayload = {
      ...relationshipQueryFromEntity(entityWithRelations),
      fileId: mainDocument._id,
      anchorsLoaded: false,
    };
    const harness: Harness = { seed: summarySeed, language: 'en', mainDocument };
    const { result } = renderQuery(harness, mocks());

    await act(async () => {
      await Promise.all([result.current.ensureAnchors(), result.current.ensureAnchors()]);
    });

    expect(loadSummary).not.toHaveBeenCalled();
    expect(loadAnchors).toHaveBeenCalledTimes(1);
    expect(loadAnchors).toHaveBeenCalledWith('shared1', { language: 'en', fileId: 'f1' });
  });

  it('does not refetch anchors when the seed already loaded them', async () => {
    const harness: Harness = { seed, language: 'en', mainDocument };
    const { result } = renderQuery(harness, mocks());

    await act(async () => {
      await Promise.all([result.current.ensureAnchors(), result.current.ensureAnchors()]);
    });

    expect(loadAnchors).not.toHaveBeenCalled();
    expect(loadSummary).not.toHaveBeenCalled();
  });

  it('retries loadResolved after a failed fetch', async () => {
    const error = new ApiError('Server error', { kind: 'http', status: 500 });
    loadResolved.mockResolvedValueOnce([undefined, error]).mockResolvedValueOnce([resolved]);
    const harness: Harness = { seed, language: 'en', mainDocument };
    const { result } = renderQuery(harness, mocks());

    await act(async () => {
      await result.current.ensureResolved();
    });
    expect(result.current.status.resolved).toBe(false);

    await act(async () => {
      await result.current.ensureResolved();
    });
    expect(loadResolved).toHaveBeenCalledTimes(2);
    expect(result.current.status.resolved).toBe(true);
  });
});
