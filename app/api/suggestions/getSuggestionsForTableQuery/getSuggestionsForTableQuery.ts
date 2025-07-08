import { Extractors } from 'api/services/informationextraction/ixextractors';
import { IXSuggestionsQuery, SuggestionCustomFilter } from 'shared/types/suggestionType';
import { ObjectId } from 'mongodb';
import { IXExtractorType } from 'shared/types/extractorType';
import entitiesModel from 'api/entities/entitiesModel';
import templates from 'api/templates';
import { propertyIsMultiselect, propertyIsRelationship } from 'shared/propertyTypes';
import { getLabeledValueStage, getMatchStage, translateCustomFilter } from '../pipelineStages';
import { IXSuggestionsModel } from '../IXSuggestionsModel';
import { PipelineBuilder } from '../queryBuilder';
import { Pagination } from '../pagination';
import { Sorter } from './sorter';

type Options = {
  sort: IXSuggestionsQuery['sort'];
  page: IXSuggestionsQuery['page'];
};

type Input = {
  extractorId: ObjectId;
  filter?: SuggestionCustomFilter;
  paginationDto?: { number: number; size: number };
  options?: Options;
};

export class GetSuggestionsForTableQuery {
  private pipelineBuilder: PipelineBuilder;

  constructor() {
    this.pipelineBuilder = new PipelineBuilder();
  }

  // eslint-disable-next-line max-statements
  async execute({ extractorId, filter, options, paginationDto }: Input) {
    const extractor = await Extractors.getById(extractorId);
    if (!extractor) {
      throw new Error(`Extractor not found id: ${extractorId}`);
    }
    // console.log('extractor', extractor);
    const targetProperty = await templates.getPropertyByName(extractor.property);

    const pagination = new Pagination({
      pageSize: paginationDto?.size,
      currentPage: paginationDto?.number,
    });

    const sorter = new Sorter({
      field: options?.sort?.property && this.toMongoField(options.sort.property, extractor),
      order: options?.sort?.order,
    });

    const [matchQuery] = getMatchStage(new ObjectId(extractorId), filter, false);
    const total = await IXSuggestionsModel.db.countDocuments(matchQuery.$match!);

    const isFromPdf = !!extractor.source?.pdf;
    const orFilters = filter && translateCustomFilter(filter);
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
    // console.log(JSON.stringify(this.pipelineBuilder.build()));
    let suggestions = await entitiesModel.db.aggregate(this.pipelineBuilder.build());

    suggestions = suggestions.map(s => {
      const propertyValue = s.currentValue?.[0]?.value ?? '';

      const isArray =
        propertyIsMultiselect(targetProperty.type) || propertyIsRelationship(targetProperty.type);

      return {
        ...s,
        currentValue: isArray ? [propertyValue] : propertyValue,
      };
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
        [`metadata.${extractor.property}`]: { $exists: true },
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

    this.pipelineBuilder.add(getLabeledValueStage()[0]);
  }

  private applyDocumentsProjectStage(extractor: IXExtractorType) {
    this.pipelineBuilder.add({
      $project: {
        entityId: '$_id',
        entityTitle: '$title',
        entityTemplateId: '$template',
        sharedId: 1,
        language: 1,
        currentValue: extractor.property === 'title' ? '$title' : `$metadata.${extractor.property}`,

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
        labeledValue: 1,
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
        currentValue: extractor.property === 'title' ? '$title' : `$metadata.${extractor.property}`,

        _id: '$suggestion._id',
        propertyName: '$suggestion.propertyName',
        extractorId: '$suggestion.extractorId',
        suggestedValue: '$suggestion.suggestedValue',
        segment: '$suggestion.segment',
        state: '$suggestion.state',
        date: '$suggestion.date',
        error: '$suggestion.error',
      },
    });
  }
}
