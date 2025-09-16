import { z } from 'zod';
import {
  AbstractController,
  Dependencies as AbstractControllerDependencies,
} from 'api/common.v2/infrastructure/AbstractController';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import {
  PROCESS_MODES,
  AUTO_ACCEPT_SOURCES,
  OVERWRITE_MODES,
} from 'api/suggestions/contracts/ProcessSuggestionsContracts';
import { ProcessSuggestions } from '../useCases/ProcessSuggestions';

type Dependencies = AbstractControllerDependencies<Request>;

const FindFiltersSchema = z
  .object({
    nonProcessed: z.boolean().optional(),
    obsolete: z.boolean().optional(),
    error: z.boolean().optional(),
  })
  .partial();

const FindSchema = z
  .object({
    enabled: z.boolean().optional(),
    size: z.coerce.number().int().min(0).default(1000).optional(),
    filters: FindFiltersSchema.optional(),
    selectedSharedIds: z.array(z.string()).optional(),
  })
  .partial();

const AutoAcceptSchema = z
  .object({
    enabled: z.boolean().optional(),
    source: z.enum(AUTO_ACCEPT_SOURCES).optional(),
    overwriteMode: z.enum(OVERWRITE_MODES).optional(),
  })
  .partial();

const RequestSchema = z
  .object({
    extractorId: z.string(),
    mode: z.enum(PROCESS_MODES),
    find: FindSchema.optional(),
    autoAccept: AutoAcceptSchema.optional(),
  })
  .superRefine((dto, ctx) => {
    // Enforce at least one filter when find is enabled for process_extractor
    if (dto.mode === 'process_extractor') {
      const findEnabled = dto.find?.enabled === true; // default: disabled unless explicitly enabled
      if (findEnabled) {
        const f = dto.find?.filters;
        const anySelected = Boolean(f?.nonProcessed || f?.obsolete || f?.error);
        if (!anySelected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'At least one filter must be selected when Find is enabled.',
            path: ['find', 'filters'],
          });
        }
      }
    }
  });

type Request = z.infer<typeof RequestSchema>;

class ProcessSuggestionsController extends AbstractController<Request> {
  constructor(dependencies: Dependencies) {
    super(dependencies);
  }

  async handle(): Promise<void> {
    const dto = RequestSchema.parse(this.request.body);
    this.ensureUser();

    const informationExtraction = new InformationExtraction();
    const useCase = new ProcessSuggestions({ informationExtraction });

    const response = await useCase.execute({
      extractorId: dto.extractorId,
      mode: dto.mode,
      find: dto.find,
      autoAccept: dto.autoAccept,
    });

    this.jsonResponse(response);
  }
}

export { ProcessSuggestionsController };
