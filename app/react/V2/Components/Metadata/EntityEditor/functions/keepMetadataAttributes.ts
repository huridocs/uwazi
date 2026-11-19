import type { MetadataValue } from '#V2/formatters/types.js';

const isMetadataEntry = (entry: unknown): entry is MetadataValue =>
  typeof entry === 'object' && entry !== null && 'value' in entry;

const storedAttributes = (entry: MetadataValue | undefined): string[] | undefined =>
  entry && Array.isArray(entry.attributes) ? entry.attributes : undefined;

const withAttributes = (entry: MetadataValue, attributes: string[] | undefined): MetadataValue => {
  if (attributes === undefined || entry.attributes !== undefined) {
    return entry;
  }
  return { ...entry, attributes };
};

const zipAttributes = (previous: MetadataValue[], next: MetadataValue[]): MetadataValue[] =>
  next.map((entry, index) => withAttributes(entry, storedAttributes(previous[index])));

const selectionKey = (value: unknown) => JSON.stringify(value);

const keepMetadataAttributes = (current: unknown, next: MetadataValue[]): MetadataValue[] => {
  if (!Array.isArray(current) || current.length !== next.length) {
    return next;
  }
  const previous = current.filter(isMetadataEntry);
  return previous.length === next.length ? zipAttributes(previous, next) : next;
};

const reuseSelectedEntries = (current: unknown, next: MetadataValue[]): MetadataValue[] => {
  const previous = Array.isArray(current) ? current.filter(isMetadataEntry) : [];
  const counts = new Map<string, number>();
  previous.forEach(entry => {
    const key = selectionKey(entry.value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const used = new Set<number>();
  return next.map(entry => {
    const key = selectionKey(entry.value);
    if (entry.attributes !== undefined || counts.get(key) !== 1) {
      return entry;
    }
    const index = previous.findIndex(
      (item, itemIndex) => !used.has(itemIndex) && selectionKey(item.value) === key
    );
    if (index < 0) {
      return entry;
    }
    used.add(index);
    return withAttributes(entry, storedAttributes(previous[index]));
  });
};

export { keepMetadataAttributes, reuseSelectedEntries };
