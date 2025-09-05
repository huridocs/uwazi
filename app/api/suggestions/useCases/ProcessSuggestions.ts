import { UseCase } from 'api/common.v2/contracts/UseCase';
import { ObjectId } from 'mongodb';
import { EnforcedWithId } from 'api/odm';
import { IXModelType } from 'shared/types/IXModelType';
import { IXExtractorType } from 'shared/types/extractorType';
import { Extractors, ModelNotReadyError } from 'api/services/informationextraction/ixextractors';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { IXServices } from 'api/services/informationextraction/IXServices';
import {
  ProcessMode,
  ProcessFindFilters,
  AutoAcceptSource,
  OverwriteMode,
} from 'api/suggestions/contracts/ProcessSuggestionsContracts';

const DEFAULT_MAX_SUGGESTIONS_SIZE = 1000;

type ProcessFindOptions = {
  enabled?: boolean;
  size?: number;
  filters?: ProcessFindFilters;
  selectedSharedIds?: string[];
};

type AutoAcceptOptions = {
  enabled?: boolean;
  source?: AutoAcceptSource;
  overwriteMode?: OverwriteMode;
};

type Input = {
  extractorId: string;
  mode: ProcessMode;
  find?: ProcessFindOptions;
  autoAccept?: AutoAcceptOptions;
  tenantName?: string;
};

type Output = { status: 'processing_suggestions' | 'ready'; message: string; data?: any };

type Dependencies = {
  informationExtraction: InformationExtraction;
};

export class ProcessSuggestions implements UseCase<Input, Output> {
  constructor(private readonly deps: Dependencies) {}

  private static async getExtractorAndModel(extractorId: string) {
    const extractorObjectId = ObjectId.createFromHexString(extractorId);
    const [[extractor], [model]] = await Promise.all([
      Extractors.get({ _id: extractorObjectId }),
      ixmodels.get({ extractorId: extractorObjectId }),
    ]);
    return [extractor, model] as const;
  }

  private static validate(
    extractor: EnforcedWithId<IXExtractorType> | undefined,
    model?: IXModelType
  ) {
    if (!extractor) throw new Error('Extractor not found');
    if (!model || model.status !== 'ready') throw new ModelNotReadyError(extractor._id.toString());
  }

  // eslint-disable-next-line max-statements
  async execute({ extractorId, mode, find, autoAccept, tenantName }: Input): Promise<Output> {
    const extractorObjectId = ObjectId.createFromHexString(extractorId);

    const [extractor, model] = await ProcessSuggestions.getExtractorAndModel(extractorId);
    ProcessSuggestions.validate(extractor, model);

    const isProcessSelected = mode === 'process_selected';
    const findEnabled = isProcessSelected ? true : find?.enabled === true;
    const findSize = Math.max(0, find?.size ?? DEFAULT_MAX_SUGGESTIONS_SIZE);
    const autoAcceptOptions: AutoAcceptOptions = {
      enabled: autoAccept?.enabled ?? false,
      source: mode === 'process_selected' ? 'previous' : (autoAccept?.source ?? 'previous'),
      overwriteMode: autoAccept?.overwriteMode ?? 'blank_only',
    };

    // Persist process run metadata on the model for recursive pick-up
    await ixmodels.setProcessRun(extractorObjectId, {
      mode,
      find: {
        enabled: findEnabled,
        size: findSize,
        filters: mode === 'process_extractor' ? find?.filters : undefined,
        selectedSharedIds:
          mode === 'process_selected' ? (find?.selectedSharedIds ?? []) : undefined,
      },
      autoAccept: autoAcceptOptions,
    });

    // Initialize run queue for process_selected
    if (mode === 'process_selected' && Array.isArray(find?.selectedSharedIds)) {
      const uniqueIds = Array.from(new Set(find.selectedSharedIds));
      await ixmodels.initializeFindRunQueue(model!._id!, uniqueIds);
    }

    if (findEnabled) {
      // Mark model as finding suggestions and set creationDate reference
      await ixmodels.startFindingSuggestions(extractorObjectId);

      // Set maxSuggestionsToFind from user request and compute filter-aware total
      const [current] = await ixmodels.get({ extractorId: extractorObjectId });
      const updated = await ixmodels.save({
        ...current,
        extractorId,
        maxSuggestionsToFind: findSize,
      });

      const total = await IXServices.computeTotalSuggestionsForProcess(
        extractorObjectId,
        updated as any,
        mode === 'process_extractor' ? find?.filters : undefined
      );
      await ixmodels.save({
        ...updated,
        extractorId: extractorObjectId,
        totalSuggestionsToFind: total,
      });

      // Start the suggestions loop
      await this.deps.informationExtraction.sendMaterialsAndTaskSuggestions(
        extractor!,
        updated,
        mode === 'process_extractor'
      );

      return {
        status: 'processing_suggestions',
        message: 'Finding suggestions',
        data: { total: findSize },
      };
    }

    // If find disabled, set totals to 0 and transition centrally
    const [currentForZero] = await ixmodels.get({
      extractorId: extractorObjectId,
    });
    await ixmodels.save({
      ...currentForZero,
      extractorId: extractorObjectId,
      totalSuggestionsToFind: 0,
    });

    if (tenantName) {
      await this.deps.informationExtraction.startAutoAcceptIfEnabled(extractorObjectId, tenantName);
    }

    return { status: 'ready', message: 'Find disabled' };
  }
}
