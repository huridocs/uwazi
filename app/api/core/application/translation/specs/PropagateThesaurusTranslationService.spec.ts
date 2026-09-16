import { PropagateThesaurusTranslationService } from '../PropagateThesaurusTranslationService.js';
import { Result } from '#api/core/libs/Result.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { ThesaurusNotFoundError } from '#api/core/domain/thesaurus/errors.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';

describe('PropagateThesaurusTranslationService', () => {
  const thesaurusId = 'thesaurus-1';
  const tenantName = 'tenant-1';

  const makeThesaurus = (values: Thesaurus['values']) =>
    new Thesaurus({ id: thesaurusId, name: 'Dict', values });

  const createSut = (thesaurus?: Thesaurus) => {
    const denormalizeThesaurus = jest.fn().mockResolvedValue(undefined);
    const getById = jest
      .fn()
      .mockResolvedValue(
        thesaurus ? Result.ok(thesaurus) : Result.fail(new ThesaurusNotFoundError(thesaurusId))
      );

    const sut = new PropagateThesaurusTranslationService({
      thesauriDS: { getById } as unknown as ThesauriDataSource,
      dispatcher: { denormalizeThesaurus } as unknown as Dispatcher,
      tenantName,
    });

    return { sut, denormalizeThesaurus, getById };
  };

  it('should dispatch denormalization when a thesaurus translation value changes', async () => {
    const { sut, denormalizeThesaurus } = createSut(
      makeThesaurus([{ id: 'age id', label: 'Age' }])
    );

    await sut.propagate([
      {
        contextId: thesaurusId,
        type: 'Thesaurus',
        previous: { Age: 'Age' },
        next: { Age: 'Age changed' },
      },
    ]);

    expect(denormalizeThesaurus).toHaveBeenCalledWith({
      thesaurusId,
      valueIds: ['age id'],
      tenantName,
    });
  });

  it('should dispatch denormalization for nested thesaurus values', async () => {
    const { sut, denormalizeThesaurus } = createSut(
      makeThesaurus([
        {
          id: 'parent_id',
          label: 'Parent',
          values: [{ id: 'child_id', label: 'Age' }],
        },
      ])
    );

    await sut.propagate([
      {
        contextId: thesaurusId,
        type: 'Thesaurus',
        previous: { Age: 'Age' },
        next: { Age: 'Age changed in child' },
      },
    ]);

    expect(denormalizeThesaurus).toHaveBeenCalledWith({
      thesaurusId,
      valueIds: ['child_id'],
      tenantName,
    });
  });

  it('should dispatch denormalization for duplicated child labels across parents', async () => {
    const { sut, denormalizeThesaurus } = createSut(
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

    await sut.propagate([
      {
        contextId: thesaurusId,
        type: 'Thesaurus',
        previous: { Age: 'Age', Email: 'Email' },
        next: { Age: 'Yes changed', Email: 'No changed' },
      },
    ]);

    expect(denormalizeThesaurus).toHaveBeenCalledWith({
      thesaurusId,
      valueIds: expect.arrayContaining([
        'yes_in_court',
        'yes_in_government',
        'no_in_court',
        'no_in_government',
      ]),
      tenantName,
    });
    expect(denormalizeThesaurus).toHaveBeenCalledTimes(1);
  });

  it('should dispatch once per thesaurus, unioning changed values across locales', async () => {
    const { sut, denormalizeThesaurus } = createSut(
      makeThesaurus([
        { id: 'age id', label: 'Age' },
        { id: 'email id', label: 'Email' },
      ])
    );

    await sut.propagate([
      {
        contextId: thesaurusId,
        type: 'Thesaurus',
        previous: { Age: 'Age' },
        next: { Age: 'Age ES' },
      },
      {
        contextId: thesaurusId,
        type: 'Thesaurus',
        previous: { Email: 'Email' },
        next: { Email: 'Email FR' },
      },
    ]);

    expect(denormalizeThesaurus).toHaveBeenCalledTimes(1);
    expect(denormalizeThesaurus).toHaveBeenCalledWith({
      thesaurusId,
      valueIds: expect.arrayContaining(['age id', 'email id']),
      tenantName,
    });
  });

  it('should not dispatch when no translation value changed', async () => {
    const { sut, denormalizeThesaurus } = createSut(
      makeThesaurus([{ id: 'age id', label: 'Age' }])
    );

    await sut.propagate([
      {
        contextId: thesaurusId,
        type: 'Thesaurus',
        previous: { Age: 'Age' },
        next: { Age: 'Age' },
      },
    ]);

    expect(denormalizeThesaurus).not.toHaveBeenCalled();
  });

  it('should not dispatch when context is not Thesaurus', async () => {
    const { sut, denormalizeThesaurus, getById } = createSut();

    await sut.propagate([
      {
        contextId: 'System',
        type: 'Uwazi UI',
        previous: { A: 'A' },
        next: { A: 'B' },
      },
    ]);

    expect(getById).not.toHaveBeenCalled();
    expect(denormalizeThesaurus).not.toHaveBeenCalled();
  });
});
