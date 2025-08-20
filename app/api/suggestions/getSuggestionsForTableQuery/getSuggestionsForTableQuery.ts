import { Extractors } from 'api/services/informationextraction/ixextractors';
import { IXSuggestionsQuery, SuggestionCustomFilter } from 'shared/types/suggestionType';
import { ObjectId } from 'mongodb';
import templates from 'api/templates';
import { propertyTypeIsMultiValued } from 'api/services/informationextraction/ixMaterials';
import { getMatchStage } from '../pipelineStages';
import { IXSuggestionsModel } from '../IXSuggestionsModel';
import { PipelineBuilder } from '../queryBuilder';
import { Pagination } from '../pagination';
import { Sorter } from './sorter';

type InputDto = {
  extractorId: string;
  filter?: SuggestionCustomFilter;
  sort?: IXSuggestionsQuery['sort'];
  pagination?: IXSuggestionsQuery['page'];
};

export class GetSuggestionsForTableQuery {
  private pipelineBuilder: PipelineBuilder;

  constructor() {
    this.pipelineBuilder = new PipelineBuilder();
  }

  // eslint-disable-next-line max-statements
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

    const { matchStage } = getMatchStage(new ObjectId(extractorId), input.filter, false);
    const total = await IXSuggestionsModel.db.countDocuments(matchStage[0].$match!);

    this.pipelineBuilder.add(matchStage[0]);

    this.pipelineBuilder.add({
      $sort: sorter.$sort,
    });

    this.pipelineBuilder.add({
      $skip: pagination.skip,
    });

    this.pipelineBuilder.add({
      $limit: pagination.pageSize,
    });

    this.applyPropertiesProjectStage();

    const pipeline = this.pipelineBuilder.build();

    let suggestions = await IXSuggestionsModel.db.aggregate(pipeline);

    suggestions = suggestions.map(s => {
      const isMultiValue = propertyTypeIsMultiValued(targetProperty.type);
      const suggestedValue = s.suggestedValue || (isMultiValue ? [] : '');

      const _s = {
        ...s,
        suggestedValue,
      };

      return _s;
    });

    return {
      suggestions,
      total,
      totalPages: pagination.calculateNumberOfPages(total),
    };
  }

  private applyPropertiesProjectStage() {
    this.pipelineBuilder.add({
      $project: {
        sharedId: '$entityId',
        entityId: '$entityLanguageId',
        entityTemplateId: '$entityTemplate',
        currentValue: 1,
        entityTitle: 1,
        language: 1,

        _id: 1,
        propertyName: 1,
        extractorId: 1,
        suggestedValue: 1,
        segment: 1,
        state: 1,
        date: 1,
        error: 1,
        fileId: 1,
        status: 1,
      },
    });
  }
}
