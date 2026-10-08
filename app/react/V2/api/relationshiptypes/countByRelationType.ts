import { apiClient } from '#V2/api/client.js';

type CountPayload = number | { value: number };

const parseCount = (data: CountPayload | undefined): number | undefined => {
  if (typeof data === 'number') return data;
  return typeof data?.value === 'number' ? data.value : undefined;
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

const countByRelationTypes = async (signal?: AbortSignal): Promise<{ [id: string]: number }> => {
  const [counts, error] = await apiClient.getJson<{ [id: string]: number }>(
    'references/count_by_relationtype',
    {},
    { signal }
  );
  if (error || counts === undefined) return {};
  return counts;
};

export { countByRelationType, countByRelationTypes };
