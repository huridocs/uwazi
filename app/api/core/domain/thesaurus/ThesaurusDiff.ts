import { Thesaurus } from './Thesaurus.js';

type Props = {
  before: Thesaurus;
  after: Thesaurus;
};

type ThesaurusDiffObject = {
  id: string;
  removedValues: Thesaurus['values'];
  updatedValues: Thesaurus['values'];
};

class ThesaurusDiff {
  constructor(private props: Props) {}

  private static readonly ROOT_ORDER_KEY = '__root__';

  get before() {
    return this.props.before;
  }

  get after() {
    return this.props.after;
  }

  private createValuesIdsSet(values: Thesaurus['values']): Set<string> {
    const ids = values.flatMap(value => {
      if (value.values) {
        return [value.id, ...this.createValuesIdsSet(value.values)];
      }

      return [value.id];
    });

    return new Set(ids);
  }

  private createValuesMap(values: Thesaurus['values']): Map<string, string> {
    const entries = values.flatMap(value => {
      const currentEntry: [string, string] = [
        value.id,
        JSON.stringify({ id: value.id, label: value.label }),
      ];

      if (value.values) {
        const nestedEntries = Array.from(this.createValuesMap(value.values).entries());
        return [currentEntry, ...nestedEntries];
      }

      return [currentEntry];
    });

    return new Map(entries);
  }

  private filterByAddedOrRemovedValues(
    values: Thesaurus['values'],
    ids: Set<string>
  ): Thesaurus['values'] {
    const addedValues = values.flatMap(value => {
      if (value.values) {
        const addedSubValues = this.filterByAddedOrRemovedValues(value.values, ids);
        const isValueAdded = !ids.has(value.id) ? [{ id: value.id, label: value.label }] : [];

        return [...isValueAdded, ...addedSubValues];
      }

      return !ids.has(value.id) ? [value] : [];
    });

    return addedValues;
  }

  private filterByUpdatedValues(
    values: Thesaurus['values'],
    beforeMap: Map<string, string>
  ): Thesaurus['values'] {
    const updatedValues = values.flatMap(value => {
      const beforeValue = beforeMap.get(value.id);
      const isValueUpdated =
        beforeValue && beforeValue !== JSON.stringify({ id: value.id, label: value.label })
          ? [{ id: value.id, label: value.label }]
          : [];

      if (value.values) {
        const updatedSubValues = this.filterByUpdatedValues(value.values, beforeMap);
        return [...isValueUpdated, ...updatedSubValues];
      }

      return isValueUpdated;
    });

    return updatedValues;
  }

  private static createValuesOrderMap(values: Thesaurus['values']): Map<string, string[]> {
    const map = new Map<string, string[]>();

    const walk = (currentValues: Thesaurus['values'], parentId: string) => {
      map.set(
        parentId,
        currentValues.map(value => value.id)
      );

      currentValues.forEach(value => {
        if (value.values) {
          walk(value.values, value.id);
        }
      });
    };

    walk(values, ThesaurusDiff.ROOT_ORDER_KEY);

    return map;
  }

  get addedValues() {
    const beforeIds = this.createValuesIdsSet(this.props.before.values);

    return this.filterByAddedOrRemovedValues(this.props.after.values, beforeIds);
  }

  get removedValues() {
    const afterIds = this.createValuesIdsSet(this.props.after.values);

    return this.filterByAddedOrRemovedValues(this.props.before.values, afterIds);
  }

  get updatedValues() {
    const beforeValues = this.createValuesMap(this.props.before.values);

    return this.filterByUpdatedValues(this.props.after.values, beforeValues);
  }

  get updatedName() {
    if (this.props.before.name !== this.props.after.name) {
      return this.props.after.name;
    }

    return undefined;
  }

  get name() {
    return this.props.after.name;
  }

  get id() {
    return this.props.after.id;
  }

  get hasChanges() {
    return (
      this.addedValues.length > 0 ||
      this.removedValues.length > 0 ||
      this.updatedValues.length > 0 ||
      this.updatedName !== undefined
    );
  }

  get hasOrderChanges() {
    const beforeOrderMap = ThesaurusDiff.createValuesOrderMap(this.props.before.values);
    const afterOrderMap = ThesaurusDiff.createValuesOrderMap(this.props.after.values);

    for (const [parentId, beforeOrder] of beforeOrderMap.entries()) {
      const afterOrder = afterOrderMap.get(parentId);

      const hasComparableOrder = afterOrder && beforeOrder.length === afterOrder.length;
      if (hasComparableOrder && beforeOrder.some((id, index) => id !== afterOrder[index])) {
        return true;
      }
    }

    return false;
  }
}

export { ThesaurusDiff };
export type { ThesaurusDiffObject };
