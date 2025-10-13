import { IncomingHttpHeaders } from 'http';
import { EntityCompositionUseCase } from './useCases/EntityCompositionUseCase';
import {
  BatchCompositionResult,
  CompositionOptions,
  CompositionResult,
} from '../domain/entities/types';

export class FluentCompositionBuilder {
  private options: CompositionOptions = {};

  constructor(
    private readonly useCase: EntityCompositionUseCase,
    private readonly entityIdOrIds: string | string[]
  ) {}

  withTemplate(): FluentCompositionBuilder {
    this.options.includeTemplate = true;
    return this;
  }

  withMetadata(): FluentCompositionBuilder {
    this.options.includeMetadata = true;
    return this;
  }

  withRelationships(): FluentCompositionBuilder {
    this.options.includeRelationships = true;
    return this;
  }

  withFiles(): FluentCompositionBuilder {
    this.options.includeFiles = true;
    return this;
  }

  withNavigation(): FluentCompositionBuilder {
    this.options.includeNavigation = true;
    return this;
  }

  withPermissions(): FluentCompositionBuilder {
    this.options.includePermissions = true;
    return this;
  }

  forCardView(): FluentCompositionBuilder {
    this.options.includeTemplate = true;
    this.options.includeMetadata = true;
    this.options.includeRelationships = false;
    this.options.includeFiles = false;
    this.options.includeNavigation = false;
    this.options.includePermissions = true;
    this.options.onlyForCards = true;
    return this;
  }

  forDetailView(): FluentCompositionBuilder {
    this.options.includeTemplate = true;
    this.options.includeMetadata = true;
    this.options.includeRelationships = true;
    this.options.includeFiles = true;
    this.options.includeNavigation = true;
    this.options.includePermissions = true;
    this.options.combineGeolocation = true;
    this.options.translateLabels = true;
    this.options.includePropertyMetadata = true;
    return this;
  }

  forForm(): FluentCompositionBuilder {
    this.options.includeMetadata = true;
    this.options.includeRelationships = true;
    this.options.includeFiles = true;
    this.options.includeNavigation = true;
    this.options.includePermissions = true;
    this.options.combineGeolocation = false;
    this.options.translateLabels = true;
    this.options.includePropertyMetadata = true;
    this.options.editionMode = true;
    return this;
  }

  includeOnlyFields(fieldNames: string[]): FluentCompositionBuilder {
    this.options.includeFields = fieldNames;
    return this;
  }

  async compose(context: {
    headers?: IncomingHttpHeaders;
  }): Promise<CompositionResult | BatchCompositionResult> {
    if (Array.isArray(this.entityIdOrIds)) {
      return this.useCase.composeEntities(this.entityIdOrIds, this.options, context);
    }
    return this.useCase.composeEntity(this.entityIdOrIds, this.options, context);
  }
}
