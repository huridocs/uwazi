import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Dispatcher } from '#api/core/application/contracts/Dispatcher.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';

type ThesaurusValueChange = {
  contextId: string;
  type?: string;
  previous: Record<string, string>;
  next: Record<string, string>;
};

type ThesaurusOption = {
  id?: string;
  label?: string;
  values?: ThesaurusOption[];
};

type Deps = {
  thesauriDS: ThesauriDataSource;
  dispatcher: Dispatcher;
  tenantName: string;
};

const flattenThesaurusValues = (values: ThesaurusOption[] = []): ThesaurusOption[] =>
  values.reduce<ThesaurusOption[]>(
    (allValues, value) => [...allValues, value, ...flattenThesaurusValues(value.values)],
    []
  );

function diffChangedValues(previous: Record<string, string>, next: Record<string, string>) {
  const changes: Record<string, string> = {};
  Object.entries(next).forEach(([key, value]) => {
    if (value && previous[key] !== undefined && previous[key] !== value) {
      changes[key] = value;
    }
  });
  return changes;
}

class PropagateThesaurusTranslationService {
  constructor(private deps: Deps) {}

  async propagate(changes: ThesaurusValueChange[]): Promise<void> {
    const thesaurusChanges = changes.filter(
      change => change.type === 'Thesaurus' && change.contextId
    );

    const changesByThesaurus = thesaurusChanges.reduce<Record<string, ThesaurusValueChange[]>>(
      (acc, change) => ({
        ...acc,
        [change.contextId]: [...(acc[change.contextId] || []), change],
      }),
      {}
    );

    await Promise.all(
      Object.entries(changesByThesaurus).map(async ([thesaurusId, thesaurusChangesList]) => {
        const valueIds = await this.resolveChangedValueIds(thesaurusId, thesaurusChangesList);

        if (valueIds.length === 0) {
          return;
        }

        await this.deps.dispatcher.denormalizeThesaurus({
          thesaurusId,
          valueIds,
          tenantName: this.deps.tenantName,
        });
      })
    );
  }

  private async resolveChangedValueIds(
    thesaurusId: string,
    changes: ThesaurusValueChange[]
  ): Promise<string[]> {
    const thesaurusResult = await this.deps.thesauriDS.getById(thesaurusId);
    const thesaurusValues = thesaurusResult.isOk()
      ? (thesaurusResult.getDataOrThrow() as Thesaurus).values
      : [];
    const flattenedThesaurusValues = flattenThesaurusValues(thesaurusValues as ThesaurusOption[]);

    const valueIds = new Set<string>();

    changes.forEach(change => {
      const valuesChanged = diffChangedValues(change.previous, change.next);

      Object.keys(valuesChanged).forEach(valueChanged => {
        flattenedThesaurusValues
          .filter(value => value.label === valueChanged && value.id)
          .forEach(value => valueIds.add(value.id as string));
      });
    });

    return Array.from(valueIds);
  }
}

export { PropagateThesaurusTranslationService };
export type { ThesaurusValueChange };
