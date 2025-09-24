/* eslint-disable max-statements */
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../socketio/setupSockets.js' o... Remove this comment to see the full error message
import { emitToTenant } from '../socketio/setupSockets.js';
// @ts-expect-error TS(2307): Cannot find module '../files.js' or its correspond... Remove this comment to see the full error message
import { storage } from '../files.js';
import urljoin from 'url-join';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import request from 'shared/JSONRequest.js';

import { ExtractedMetadataSchema } from 'shared/types/commonTypes.js';

import { EnforcedWithId } from '../odm/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/extractorTy... Remove this comment to see the full error message
import { IXExtractorType } from 'shared/types/extractorType.js';
// @ts-expect-error TS(2307): Cannot find module '../suggestions/suggestions.js'... Remove this comment to see the full error message
import { Suggestions } from '../suggestions/suggestions.js';
import {
  FileWithAggregation,
  getFilesForTraining,
  NoFilesForTraining,
  propertyTypeIsWithoutExtractedMetadata,
} from './ixMaterials.js';
import { IXWebSocketEvents } from './WebSocketEvents.js';
import { CommonMaterialsData, MaterialsData } from './InformationExtraction.js';
import { IXTaskService } from './TaskService.js';
import ixmodels from './ixmodels.js';

type Input = {
  extractor: EnforcedWithId<IXExtractorType>;
};
type Output = any;

type Dependencies = {
  serviceUrl: string;
  tenantName: string;
  iXTaskService: IXTaskService;
};

type SendMaterialsToServiceInput = {
  file: FileWithAggregation;
  extractorId: string;
  propertyLabeledData: ExtractedMetadataSchema | undefined;
  propertyValue: FileWithAggregation['propertyValue'];
  propertyType: FileWithAggregation['propertyType'];
};

export class TrainModelForPDF implements UseCase<Input, Output> {
  constructor(private props: Dependencies) {}

  async execute({ extractor }: Input): Promise<Output> {
    try {
      const { process } = await getFilesForTraining(extractor);
      const processedEntityIds: string[] = [];

      await process(async file => {
        const xmlName = file.segmentation.xmlname!;
        const xmlExists = await storage.fileExists(xmlName, 'segmentation');

        const propertyLabeledData = file.extractedMetadata?.find(
          (labeledData: any) => labeledData.name === extractor.property
        );
        const { propertyValue, propertyType } = file;

        const missingData = propertyTypeIsWithoutExtractedMetadata(propertyType)
          ? !propertyValue
          : false;

        if (!xmlExists || missingData) return;

        await this.sendXmlToService(xmlName, extractor._id.toString());

        await this.sendMaterialsToService({
          file,
          extractorId: extractor._id.toString(),
          propertyLabeledData,
          propertyValue,
          propertyType,
        });

        processedEntityIds.push(file.entity);
      });

      if (!processedEntityIds.length) {
        throw new NoFilesForTraining();
      }

      await Suggestions.markSuggestionsAsTrainingSamples(
        processedEntityIds,
        extractor._id.toString()
      );

      await this.props.iXTaskService.createModelTask({
        extractor,
      });
    } catch (e) {
      await ixmodels.stopTraining(extractor._id);

      emitToTenant(this.props.tenantName, IXWebSocketEvents.ErrorTrainingModel, {
        message: e.message || 'An error occurred when sending Files for training',
      });

      throw e;
    }
  }

  private async sendXmlToService(xmlName: string, extractorId: string) {
    const fileContent = await storage.fileContents(xmlName, 'segmentation');
    const endpoint = 'xml_to_train';
    const url = urljoin(this.props.serviceUrl, endpoint, this.props.tenantName, extractorId);
    return request.uploadFile(url, xmlName, fileContent);
  }

  private async sendMaterialsToService({
    file,
    extractorId,
    propertyLabeledData,
    propertyType,
    propertyValue,
  }: SendMaterialsToServiceInput) {
    let data: MaterialsData = {
      xml_file_name: file.segmentation.xmlname!,
      id: extractorId,
      tenant: this.props.tenantName,
      xml_segments_boxes: file.segmentation.segmentation?.paragraphs,
      page_width: file.segmentation.segmentation?.page_width,
      page_height: file.segmentation.segmentation?.page_height,
    };

    data = this.extendMaterialsWithLabeledData(
      propertyLabeledData,
      propertyValue,
      propertyType,
      file,
      data
    );

    await request.post(urljoin(this.props.serviceUrl, 'labeled_data'), data);
  }

  // eslint-disable-next-line max-params, class-methods-use-this
  private extendMaterialsWithLabeledData(
    propertyLabeledData: ExtractedMetadataSchema | undefined,
    propertyValue: FileWithAggregation['propertyValue'],
    propertyType: FileWithAggregation['propertyType'],
    file: FileWithAggregation,
    _data: CommonMaterialsData
  ): MaterialsData {
    let data: MaterialsData = { ..._data, language_iso: file.language };

    const noExtractedData = propertyTypeIsWithoutExtractedMetadata(propertyType);

    if (!noExtractedData) {
      data = {
        ...data,
        label_text: propertyValue,
      };

      if (propertyLabeledData) {
        data = {
          ...data,
          // @ts-expect-error TS(7006): Parameter 'r' implicitly has an 'any' type.
          label_segments_boxes: propertyLabeledData.selection?.selectionRectangles?.map(r => {
            const { page, ...rectangle } = r;
            return { ...rectangle, page_number: page };
          }),
        };
      }
    }

    if (noExtractedData) {
      if (!Array.isArray(propertyValue)) {
        throw new Error('Property value should be an array');
      }
      data = {
        ...data,
        values: propertyValue.map(({ value, label }) => ({ id: value, label })),
      };
    }

    return data;
  }
}
