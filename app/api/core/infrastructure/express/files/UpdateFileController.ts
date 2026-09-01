import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UpdateFileInput } from '#api/core/application/UpdateFile.js';
import { UpdateFileUseCaseFactory } from '../../factories/UpdateFileUseCaseFactory.js';
import { LanguageUtils } from '#shared/language/index.js';
import { FileMappers } from '../../mongodb/files/FilesMappers.js';

const TocEntrySchema = z.object({
  label: z.string().optional(),
  indentation: z.number().optional(),
  selectionRectangles: z
    .array(
      z.object({
        top: z.number(),
        left: z.number(),
        width: z.number(),
        height: z.number(),
        page: z.string().optional(),
      })
    )
    .optional(),
});

const SelectionRectangleSchema = z.object({
  top: z.number(),
  left: z.number(),
  width: z.number(),
  height: z.number(),
  page: z.string().optional(),
});

const SelectionSchema = z.object({
  text: z.string().optional(),
  selectionRectangles: z.array(SelectionRectangleSchema).optional(),
});

const PropertySelectionSchema = z.object({
  propertyID: z.string().optional(),
  name: z.string().optional(),
  timestamp: z.string().optional(),
  deleteSelection: z.boolean().optional(),
  selection: SelectionSchema.optional(),
});

const RequestSchema = z.object({
  _id: z.string().min(1),
  originalname: z.string().min(1).optional(),
  language: z.string().min(3).optional(),
  toc: z.array(TocEntrySchema).optional(),
  propertySelections: z.array(PropertySelectionSchema).optional(),
  url: z.string().url().optional(),
});

class UpdateFileController extends AbstractController {
  protected async handle(): Promise<void> {
    const request = RequestSchema.parse(this.request.body);

    const input: UpdateFileInput = {
      fileId: request._id,
      originalname: request.originalname,
      language: request.language
        ? LanguageUtils.fromISO639_3(request.language).ISO639_1
        : undefined,
      toc: request.toc,
      propertySelections: request.propertySelections,
      url: request.url,
    };

    const output = await UpdateFileUseCaseFactory.default().execute(input);

    this.response.json(FileMappers.toDBO(output));
  }
}

export { UpdateFileController };
