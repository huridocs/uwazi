import { Extractors } from 'api/services/informationextraction/ixextractors';
import { IXSuggestionsQuery, SuggestionCustomFilter } from 'shared/types/suggestionType';
import { ObjectId } from 'mongodb';
import { IXExtractorType } from 'shared/types/extractorType';
import entitiesModel from 'api/entities/entitiesModel';
import templates from 'api/templates';
import { propertyTypeIsMultiValued } from 'api/services/informationextraction/ixMaterials';
import { getMatchStage, translateCustomFilter } from '../pipelineStages';
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

    const pagination = new Pagination({
      pageSize: input?.pagination?.size,
      currentPage: input?.pagination?.number,
    });

    const sorter = new Sorter({
      field: input?.sort?.property && this.toMongoField(input.sort.property, extractor),
      order: input?.sort?.order,
    });

    const [matchQuery] = getMatchStage(new ObjectId(extractorId), input.filter, false);
    const total = await IXSuggestionsModel.db.countDocuments(matchQuery.$match!);

    const isFromPdf = !!extractor.source?.pdf;
    const orFilters = input.filter && translateCustomFilter(input.filter);
    const shouldPrePaginate = !orFilters?.length && !isFromPdf;

    this.applyEntityMatchStage(extractor);

    if (sorter.isSortingOnEntitiesCollection) {
      this.pipelineBuilder.add({
        $sort: sorter.$sort,
      });
    }

    if (shouldPrePaginate) {
      this.pipelineBuilder.add({
        $skip: pagination.skip,
      });

      this.pipelineBuilder.add({
        $limit: pagination.pageSize,
      });
    }

    this.applySuggestionsLookupStage(extractor, orFilters);

    if (!sorter.isSortingOnEntitiesCollection) {
      this.pipelineBuilder.add({
        $sort: sorter.$sort,
      });
    }

    if (!shouldPrePaginate) {
      this.pipelineBuilder.add({
        $skip: pagination.skip,
      });

      this.pipelineBuilder.add({
        $limit: pagination.pageSize,
      });
    }

    if (isFromPdf) {
      this.applyFilesLookupStage();
      this.applyDocumentsProjectStage(extractor);
    }

    if (!isFromPdf) {
      this.applyPropertiesProjectStage(extractor);
    }

    const pipeline = this.pipelineBuilder.build();

    let suggestions = await entitiesModel.db.aggregate(pipeline);

    suggestions = suggestions.map(s => {
      const isMultiValue = propertyTypeIsMultiValued(targetProperty.type);
      const suggestedValue = s.suggestedValue || (isMultiValue ? [] : '');
      const currentValue = isMultiValue ? s?.currentValue || [] : s?.currentValue?.[0] || '';

      const _s = {
        ...s,
        currentValue,
        suggestedValue,
      };

      if (s.extractedMetadata) {
        const labeledValue =
          s.extractedMetadata.find((e: any) => e.name === extractor.property)?.selection.text || '';

        _s.labeledValue = labeledValue;
      }

      return _s;
    });

    return {
      suggestions,
      total,
      totalPages: pagination.calculateNumberOfPages(total),
    };
  }

  private toMongoField(filter: string, extractor: IXExtractorType) {
    const map: Record<string, string> = {
      entityTitle: 'title',
      currentValue: `metadata.${extractor.property}`,
      segment: 'suggestion.segment',
    };

    const mapped = map[filter];

    if (!mapped) {
      throw new Error(`The following field was not mapped: ${filter}`);
    }

    return mapped;
  }

  private applyEntityMatchStage(extractor: IXExtractorType) {
    this.pipelineBuilder.add({
      $match: {
        template: { $in: extractor.templates },
      },
    });
  }

  private applySuggestionsLookupStage(
    extractor: IXExtractorType,
    orFilters?: Record<string, boolean>[]
  ) {
    this.pipelineBuilder.add({
      $lookup: {
        from: 'ixsuggestions',
        as: 'suggestion',
        let: {
          language: '$language',
          sharedId: '$sharedId',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$extractorId', extractor._id],
                  },
                  {
                    $eq: ['$entityId', '$$sharedId'],
                  },
                  {
                    $eq: ['$language', '$$language'],
                  },
                ],
              },

              ...(orFilters?.length ? { $or: orFilters } : {}),
            },
          },
        ],
      },
    });

    this.pipelineBuilder.add({
      $unwind: '$suggestion',
    });
  }

  private applyFilesLookupStage() {
    this.pipelineBuilder.add({
      $lookup: {
        from: 'files',
        localField: 'suggestion.fileId',
        foreignField: '_id',
        as: 'file',
        pipeline: [
          {
            $project: {
              extractedMetadata: 1,
              page: 1,
              selectionRectangle: 1,
            },
          },
        ],
      },
    });

    this.pipelineBuilder.add({
      $unwind: '$file',
    });
  }

  private applyDocumentsProjectStage(extractor: IXExtractorType) {
    this.pipelineBuilder.add({
      $project: {
        entityId: '$_id',
        entityTitle: '$title',
        entityTemplateId: '$template',
        sharedId: 1,
        language: 1,

        _id: '$suggestion._id',
        propertyName: '$suggestion.propertyName',
        extractorId: '$suggestion.extractorId',
        suggestedValue: '$suggestion.suggestedValue',
        segment: '$suggestion.segment',
        state: '$suggestion.state',
        date: '$suggestion.date',
        error: '$suggestion.error',

        fileId: '$suggestion.fileId',
        page: '$file.page',
        extractedMetadata: '$file.extractedMetadata',
        selectionRectangle: '$file.selectionRectangle',
        currentValue: {
          $cond: {
            if: { $eq: [extractor.property, 'title'] },
            then: [{ $ifNull: ['$title', null] }],
            else: `$metadata.${extractor.property}.value`,
          },
        },
      },
    });
  }

  private applyPropertiesProjectStage(extractor: IXExtractorType) {
    this.pipelineBuilder.add({
      $project: {
        entityId: '$_id',
        entityTitle: '$title',
        entityTemplateId: '$template',
        sharedId: 1,
        language: 1,

        _id: '$suggestion._id',
        propertyName: '$suggestion.propertyName',
        extractorId: '$suggestion.extractorId',
        suggestedValue: '$suggestion.suggestedValue',
        segment: '$suggestion.segment',
        state: '$suggestion.state',
        date: '$suggestion.date',
        error: '$suggestion.error',
        currentValue: {
          $cond: {
            if: { $eq: [extractor.property, 'title'] },
            then: [{ $ifNull: ['$title', null] }],
            else: `$metadata.${extractor.property}.value`,
          },
        },
      },
    });
  }
}
