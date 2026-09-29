import { DenormalizeEntitiesChunkHandler } from '../DenormalizeEntitiesChunkHandler.js';

describe('DenormalizeEntitiesChunkHandler', () => {
  const createSut = (deps: any) => new DenormalizeEntitiesChunkHandler(deps);

  it('routes thesaurus kind to the thesaurus use case', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const Factory = { default: jest.fn().mockReturnValue({ execute }) };

    const sut = createSut({
      DenormalizeThesaurusEntitiesUseCaseFactory: Factory,
      DenormalizeRelationshipsUseCaseFactory: { default: jest.fn() },
    });

    await sut.handleDispatch(
      jest.fn(),
      { kind: 'thesaurus', userId: 'u', thesaurusId: 't1', sharedIds: ['a', 'b'] },
      { namespace: 'tenant', maxRetries: 3, retryCount: 0 }
    );

    expect(Factory.default).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({ thesaurusId: 't1', sharedIds: ['a', 'b'] });
  });

  it('routes relationships kind to the relationships use case', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const Factory = { default: jest.fn().mockReturnValue({ execute }) };

    const sut = createSut({
      DenormalizeThesaurusEntitiesUseCaseFactory: { default: jest.fn() },
      DenormalizeRelationshipsUseCaseFactory: Factory,
    });

    await sut.handleDispatch(
      jest.fn(),
      { kind: 'relationships', userId: 'u', sharedIds: ['a', 'b'] },
      { namespace: 'tenant', maxRetries: 3, retryCount: 0 }
    );

    expect(Factory.default).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({ sharedIds: ['a', 'b'] });
  });
});
