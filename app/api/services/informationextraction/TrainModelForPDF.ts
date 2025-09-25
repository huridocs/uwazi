/* eslint-disable max-statements */
import { UseCase } from 'api/common.v2/contracts/UseCase';
import { emitToTenant } from 'api/socketio/setupSockets';
import { storage } from 'api/files';
import urljoin from 'url-join';
import request from 'shared/JSONRequest';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { EnforcedWithId } from 'api/odm';
import { IXExtractorType } from 'shared/types/extractorType';
import { Suggestions } from 'api/suggestions/suggestions';
import {
  FileWithAggregation,
  NoFilesForTraining,
  propertyTypeIsWithoutExtractedMetadata,
} from './ixMaterials';
import { getPdfTrainingProcess } from './FetchMaterialsForTraining';
import { IXWebSocketEvents } from './WebSocketEvents';
import { CommonMaterialsData, MaterialsData } from './InformationExtraction';
import { IXTaskService } from './TaskService';
import ixmodels from './ixmodels';

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
      const { process } = await getPdfTrainingProcess(extractor);
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
      useForTraining: !!file.useForTraining,
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
