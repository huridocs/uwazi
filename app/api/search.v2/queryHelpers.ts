import { elastic } from 'api/search';

export const cleanUp = (value: any) => value;

export const searchStringMethod = async (searchString: string | number) => {
  const validationResult = await elastic.indices.validateQuery({
    body: { query: { query_string: { query: searchString } } },
  });
  return validationResult.body.valid ? 'query_string' : 'simple_query_string';
};
