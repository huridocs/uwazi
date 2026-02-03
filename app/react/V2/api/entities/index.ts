import api from 'app/utils/api';
import { IncomingHttpHeaders } from 'http';
import { EntitySchema } from 'shared/types/entityType';
import { FetchResponseError } from 'shared/JSONRequest';
import { RequestParams } from 'app/utils/RequestParams';
import { SearchQuery, CompoundFilter } from 'shared/types/SearchQueryType';
import qs from 'qs';
import { getEntityCompositionUseCase } from 'V2/application/container/singletons';
import { cardViewOptions } from 'V2/application/optionsPresets';
import { Entity } from 'V2/domain/entities/Entity';
import { EntitySearchResponse } from '../types';
import * as formatter from './formatter';

const getById = async ({
  _id,
  language,
  omitRelationships = true,
}: {
  _id: string;
  language: string;
  omitRelationships?: boolean;
}): Promise<EntitySchema[]> => {
  try {
    const requestParams = new RequestParams({
      _id,
      omitRelationships,
    });

    api.locale(language);

    const {
      json: { rows: response },
    } = await api.get('entities', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const getBySharedId = async (
  {
    sharedId,
    language,
    omitRelationships = true,
  }: { sharedId: string; language: string; omitRelationships?: boolean },
  headers?: IncomingHttpHeaders
): Promise<EntitySchema[]> => {
  try {
    const requestParams = new RequestParams(
      {
        sharedId,
        omitRelationships,
      },
      headers
    );

    api.locale(language);

    const {
      json: { rows: response },
    } = await api.get('entities', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const save = async (entity: EntitySchema): Promise<EntitySchema | FetchResponseError> => {
  try {
    const requestParams = new RequestParams(entity);
    const { json: response } = await api.post('entities', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const coerceValue = async (
  value: string | Date,
  type: string,
  locale: string
): Promise<{ success: string; value: number }> => {
  try {
    const requestParams = new RequestParams({
      locale,
      value,
      type,
    });
    const { json: response } = await api.post('entities/coerce_value', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const searchByTitle = async (
  {
    title,
    fields = ['title', 'sharedId', 'template'],
    template,
    limit,
    includeFiles = false,
  }: {
    title: string;
    fields?: string[];
    template?: string[];
    limit?: number;
    includeFiles?: boolean;
  },
  headers?: IncomingHttpHeaders
): Promise<Entity[]> => {
  try {
    const finalFields = includeFiles
      ? [...new Set([...fields, 'documents', 'attachments'])]
      : fields;

    const filter: SearchQuery['filter'] = {
      searchString: `title:${title}~2`,
    };

    if (template && template.length > 0) {
      const templateFilter: CompoundFilter = {
        values: template,
        operator: 'OR',
      };
      filter.template = templateFilter;
    }

    const searchQuery: SearchQuery = {
      fields: finalFields,
      filter,
      ...(limit && { page: { limit } }),
    };

    const requestParams = new RequestParams(qs.stringify(searchQuery), headers);

    const response: { json: EntitySearchResponse } = await api.get('v2/search', requestParams);
    const searchResults = response.json.data;

    if (searchResults.length === 0) {
      return [];
    }

    const entityCompositionUseCase = await getEntityCompositionUseCase();
    const compositionOptions = includeFiles
      ? { ...cardViewOptions, includeSupportingFiles: true }
      : cardViewOptions;

    const compositionResults = await Promise.all(
      searchResults.map(async entity => {
        const compositionResult = await entityCompositionUseCase.composeEntityData(
          entity as EntitySchema,
          compositionOptions
        );

        return compositionResult.success ? compositionResult.entity : null;
      })
    );

    return compositionResults.filter((entity): entity is Entity => entity !== null);
  } catch (e) {
    return [];
  }
};

export { getById, save, coerceValue, formatter, getBySharedId, searchByTitle };
