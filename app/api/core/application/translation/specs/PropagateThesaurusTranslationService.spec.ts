import { PropagateThesaurusTranslationService } from '../PropagateThesaurusTranslationService.js';
import { Result } from '#api/core/libs/Result.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { ThesaurusNotFoundError } from '#api/core/domain/thesaurus/errors.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesaurusMetadataRenamer } from '#api/core/application/contracts/ThesaurusMetadataRenamer.js';

describe('PropagateThesaurusTranslationService', () => {
  const thesaurusId = 'thesaurus-1';

  const makeThesaurus = (values: Thesaurus['values']) =>
    new Thesaurus({ id: thesaurusId, name: 'Dict', values });

  const createSut = (thesaurus?: Thesaurus) => {
    const renameInMetadata = jest.fn().mockResolvedValue(undefined);
    const getById = jest
      .fn()
      .mockResolvedValue(
        thesaurus ? Result.ok(thesaurus) : Result.fail(new ThesaurusNotFoundError(thesaurusId))
      );

    const sut = new PropagateThesaurusTranslationService({
      thesauriDS: { getById } as unknown as ThesauriDataSource,
      metadataRenamer: { renameInMetadata } as ThesaurusMetadataRenamer,
    });

    return { sut, renameInMetadata, getById };
  };

  it('should rename metadata when a thesaurus translation value changes', async () => {
    const { sut, renameInMetadata } = createSut(makeThesaurus([{ id: 'age id', label: 'Age' }]));

    await sut.forContext(
      {
        locale: 'en',
        contexts: [
          {
            id: thesaurusId,
            type: 'Thesaurus',
            values: [{ key: 'Age', value: 'Age changed' }],
          },
        ],
      },
      {
        id: thesaurusId,
        type: 'Thesaurus',
        values: [{ key: 'Age', value: 'Age' }],
      }
    );

    expect(renameInMetadata).toHaveBeenCalledWith('age id', 'Age changed', thesaurusId, 'en');
  });

  it('should rename nested thesaurus values', async () => {
    const { sut, renameInMetadata } = createSut(
      makeThesaurus([
        {
          id: 'parent_id',
          label: 'Parent',
          values: [{ id: 'child_id', label: 'Age' }],
        },
      ])
    );

    await sut.forContext(
      {
        locale: 'en',
        contexts: [
          {
            id: thesaurusId,
            type: 'Thesaurus',
            values: [{ key: 'Age', value: 'Age changed in child' }],
          },
        ],
      },
      {
        id: thesaurusId,
        type: 'Thesaurus',
        values: [{ key: 'Age', value: 'Age' }],
      }
    );

    expect(renameInMetadata).toHaveBeenCalledWith(
      'child_id',
      'Age changed in child',
      thesaurusId,
      'en'
    );
  });

  it('should rename duplicated child labels across parents', async () => {
    const { sut, renameInMetadata } = createSut(
      makeThesaurus([
        {
          id: 'in_court',
          label: 'in court',
          values: [
            { id: 'yes_in_court', label: 'Age' },
            { id: 'no_in_court', label: 'Email' },
          ],
        },
        {
          id: 'in_government',
          label: 'in government',
          values: [
            { id: 'yes_in_government', label: 'Age' },
            { id: 'no_in_government', label: 'Email' },
          ],
        },
      ])
    );

    await sut.forContext(
      {
        locale: 'en',
        contexts: [
          {
            id: thesaurusId,
            type: 'Thesaurus',
            values: [
              { key: 'Age', value: 'Yes changed' },
              { key: 'Email', value: 'No changed' },
            ],
          },
        ],
      },
      {
        id: thesaurusId,
        type: 'Thesaurus',
        values: [
          { key: 'Age', value: 'Age' },
          { key: 'Email', value: 'Email' },
        ],
      }
    );

    expect(renameInMetadata).toHaveBeenCalledWith('yes_in_court', 'Yes changed', thesaurusId, 'en');
    expect(renameInMetadata).toHaveBeenCalledWith(
      'yes_in_government',
      'Yes changed',
      thesaurusId,
      'en'
    );
    expect(renameInMetadata).toHaveBeenCalledWith('no_in_court', 'No changed', thesaurusId, 'en');
    expect(renameInMetadata).toHaveBeenCalledWith(
      'no_in_government',
      'No changed',
      thesaurusId,
      'en'
    );
  });

  it('should not rename when context is not Thesaurus', async () => {
    const { sut, renameInMetadata, getById } = createSut();

    await sut.forContext(
      {
        locale: 'en',
        contexts: [{ id: 'System', type: 'Uwazi UI', values: [{ key: 'A', value: 'B' }] }],
      },
      { id: 'System', type: 'Uwazi UI', values: [{ key: 'A', value: 'A' }] }
    );

    expect(getById).not.toHaveBeenCalled();
    expect(renameInMetadata).not.toHaveBeenCalled();
  });
});
