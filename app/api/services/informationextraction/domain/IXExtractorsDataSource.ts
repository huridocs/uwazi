import { ObjectId } from 'mongodb';
import { IXExtractorType } from '#shared/types/extractorType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';

/**
 * `_id` is narrowed to `ObjectId`, mirroring what the retired mongoose model returned
 * (`EnforcedWithId`), because consumers rely on it. Declared here rather than imported from
 * the odm so this port does not depend on the layer it replaces. Whether stage 6 keeps
 * ObjectIds or normalises to strings is a stage-5 schema decision.
 */
export type Extractor = IXExtractorType & { _id: ObjectId };

/**
 * Persistence port for `ixextractors`.
 *
 * Every method is a named operation. No mongo query object, `$`-operator or dotted path may
 * appear in a parameter or a return type — a pipeline crossing this interface is what would
 * make the Postgres implementation (stage 6) impossible.
 *
 * The operations here were derived from the ~12 real call sites, not designed up front; see
 * plans/information-extraction-rewrite/stage-2-dao-surface.md §2.
 *
 * Return shape deliberately mirrors what the retired mongoose model returned, `ObjectId`s
 * included, so that retiring the model stayed a pure move. Normalising those to strings is a
 * stage-5 schema decision, not a stage-4a one.
 */
export interface IXExtractorsDataSource {
  getById(id: ObjectIdSchema): Promise<Extractor | undefined>;
  getByIds(ids: ObjectIdSchema[]): Promise<Extractor[]>;
  getAll(): Promise<Extractor[]>;

  /** Every extractor targeting this template, regardless of source. */
  getByTemplate(templateId: ObjectIdSchema): Promise<Extractor[]>;

  /** Extractors on this template whose source is an entity property (`source.property`). */
  getPropertySourceExtractorsForTemplate(templateId: ObjectIdSchema): Promise<Extractor[]>;

  /** Extractors on this template whose source is the document itself (`source.pdf`). */
  getPdfSourceExtractorsForTemplate(templateId: ObjectIdSchema): Promise<Extractor[]>;

  /**
   * Extractors on this template whose property is *not* in `propertyNamesToKeep` — i.e. the ones
   * orphaned when a template stops carrying those properties.
   */
  getByTemplateExcludingProperties(
    templateId: ObjectIdSchema,
    propertyNamesToKeep: string[]
  ): Promise<Extractor[]>;

  create(extractor: Omit<IXExtractorType, '_id'>): Promise<Extractor>;
  update(extractor: IXExtractorType): Promise<Extractor>;

  deleteByIds(ids: ObjectIdSchema[]): Promise<void>;

  /** Detach one template from each of these extractors. */
  removeTemplateFromExtractors(ids: ObjectIdSchema[], templateId: ObjectIdSchema): Promise<void>;

  /** Delete those of these extractors that are left targeting no template at all. */
  deleteEmptyByIds(ids: ObjectIdSchema[]): Promise<void>;
}
