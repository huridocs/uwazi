import { apiClient } from '#V2/api/client.js';

const countByRelationTypes = async (
  ids: string[],
  signal?: AbortSignal
): Promise<{ [id: string]: number }> => {
  if (ids.length === 0) return {};
  const [counts, error] = await apiClient.getJson<{ [id: string]: number }>(
    'references/count_by_relationtype',
    { relationtypeIds: ids.join(',') },
    { signal }
  );
  return error ? {} : counts;
};

export { countByRelationTypes };
