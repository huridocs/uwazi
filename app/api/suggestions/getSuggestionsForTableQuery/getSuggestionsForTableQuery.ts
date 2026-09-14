import { ObjectId } from 'mongodb';
import { Extractors } from '#api/services/informationextraction/ixextractors.js';
import { IXSuggestionsQuery } from '#shared/types/suggestionType.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { propertyTypeIsMultiValued } from '#api/services/informationextraction/ixMaterials.js';
import {
  IXSuggestionsTableQueryService,
  SuggestionStatusFilter,
} from '../domain/IXSuggestionsTableQueryService.js';
import { Pagination } from '../pagination.js';
import { Sorter } from './sorter.js';

type InputDto = {
  extractorId: string;
  filter?: SuggestionStatusFilter;
  sort?: IXSuggestionsQuery['sort'];
  pagination?: IXSuggestionsQuery['page'];
};

/**
 * The store-independent half of the settings suggestions table: which extractor and property the
 * table is showing, and what an absent `suggestedValue` should read as.
 *
 * Split out of the mongo pipeline it used to be fused with so that a second store implements
 * `IXSuggestionsTableQueryService` alone. Everything asserted by
 * `specs/getSuggestionsForTableQuery.spec.ts` therefore holds for every store.
 */
export class GetSuggestionsForTableQuery {
  private queryService: IXSuggestionsTableQueryService;

  constructor(queryService: IXSuggestionsTableQueryService) {
    this.queryService = queryService;
  }

  async execute(input: InputDto) {
    const extractorId = new ObjectId(input.extractorId);
    const extractor = await Extractors.getById(extractorId);
    if (!extractor) {
      throw new Error(`Extractor not found id: ${extractorId}`);
    }
    const targetProperty = await templates.getPropertyByName(extractor.property);

    const sorter = new Sorter({
      field: input?.sort?.property,
      order: input?.sort?.order,
    });

    const pagination = new Pagination({
      pageSize: input?.pagination?.size,
      currentPage: input?.pagination?.number,
    });

    const { rows, total } = await this.queryService.getForTable({
      extractorId,
      statusFilter: input.filter,
      sort: { field: sorter.field, order: sorter.order },
      page: { skip: pagination.skip, limit: pagination.pageSize },
    });

    const isMultiValue = propertyTypeIsMultiValued(targetProperty.type);

    const suggestions = rows.map(row => ({
      ...row,
      suggestedValue: row.suggestedValue || (isMultiValue ? [] : ''),
    }));

    return {
      suggestions,
      total,
      totalPages: pagination.calculateNumberOfPages(total),
    };
  }
}
