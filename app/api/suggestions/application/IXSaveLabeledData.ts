import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { FilesDataSource } from 'api/files.v2/contracts/FilesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { IXExtractorsDataSource } from '../domain/IXExtractorsDataSource';
import { Document } from 'api/files.v2/model/Document';
import { IXErrorCode, IXValidationError } from '../domain/IXValidationError';

interface Dependencies {
  entityDS: EntitiesDataSource;
  extractorsDS: IXExtractorsDataSource;
  templatesDS: TemplatesDataSource;
  filesDS: FilesDataSource;
}

interface ExecuteParams {
  extractorId: string;
  sourceId: string;
  labeledData: {
    propertyID: string;
    name: string;
    timestamp: string;
    deleteSelection: boolean;
    selection: {
      text: string;
      selectionRectangles: {
        top: number;
        left: number;
        width: number;
        height: number;
        page: string;
      }[];
    };
  };

  language: LanguageISO6391;
}

export class IXSaveLabeledData {
  private entityDS: EntitiesDataSource;

  private extractorsDS: IXExtractorsDataSource;

  private templatesDS: TemplatesDataSource;

  private filesDS: FilesDataSource;

  constructor(dependencies: Dependencies) {
    this.entityDS = dependencies.entityDS;
    this.extractorsDS = dependencies.extractorsDS;
    this.templatesDS = dependencies.templatesDS;
    this.filesDS = dependencies.filesDS;
  }

  async execute({ extractorId, sourceId, labeledData, language }: ExecuteParams): Promise<void> {
    const extractor = await this.getExtractor(extractorId);
    const file = await this.getFile(sourceId);
    const entity = await this.getEntity(file.entity, language);
    const property = await this.getProperty(extractor.property);

    await this.entityDS.updateEntity(entity.setPropertyValue(property, labeledData.selection.text));

    file.extractedMetadata = [labeledData];
    await this.filesDS.update(file);
  }

  private async getExtractor(extractorId: string) {
    const extractor = await this.extractorsDS.getById(extractorId);

    if (!extractor) {
      throw new IXValidationError(
        IXErrorCode.EXTRACTOR_NOT_FOUND,
        `extractor not found: ${extractorId}`
      );
    }

    return extractor;
  }

  private async getFile(sourceId: string) {
    const file = await this.filesDS.getById(sourceId);

    if (!file) {
      throw new IXValidationError(IXErrorCode.FILE_NOT_FOUND, `file not found: ${sourceId}`);
    }

    if (!(file instanceof Document)) {
      throw new IXValidationError(
        IXErrorCode.FILE_IS_NOT_DOCUMENT,
        `Only documents can be data labeled for ix current file is ${file.constructor.name}`
      );
    }

    return file;
  }

  private async getEntity(entityId: string, language: string) {
    const [entity] = await this.entityDS.getByIds([entityId], language).all();

    if (!entity) {
      throw new IXValidationError(IXErrorCode.ENTITY_NOT_FOUND, `entity not found: ${entityId}`);
    }

    return entity;
  }

  private async getProperty(propertyName: string) {
    return this.templatesDS.getPropertyByName(propertyName);
  }
}
