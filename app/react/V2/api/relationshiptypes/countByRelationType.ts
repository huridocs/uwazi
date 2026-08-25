import { apiClient } from '#V2/api/client.js';

type CountPayload = number | { value: number };

const parseCount = (data: unknown): number | undefined => {
  if (typeof data === 'number') return data;
  if (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof data.value === 'number'
  ) {
    return data.value;
  }
  return undefined;
};

const countByRelationType = async (
  relationtypeId: string,
  signal?: AbortSignal
): Promise<number | undefined> => {
  const [data, error] = await apiClient.getJson<CountPayload>(
    'references/count_by_relationtype',
    { relationtypeId },
    { signal }
  );
  if (error) return undefined;
  return parseCount(data);
};

const countByRelationTypes = async (
  ids: string[],
  signal?: AbortSignal
): Promise<{ [id: string]: number }> => {
  if (ids.length === 0) return {};
  const entries = await Promise.all(
    ids.map(async id => ({ id, count: await countByRelationType(id, signal) }))
  );
  return entries.reduce<{ [id: string]: number }>((acc, { id, count }) => {
    if (count !== undefined) acc[id] = count;
    return acc;
  }, {});
};

export { countByRelationType, countByRelationTypes };
