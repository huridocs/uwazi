/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface IXExtractorType {
  _id: ObjectIdSchema;
  name: string;
  source: {
    pdf?: boolean;
    property?: string;
  };
  property: string;
  templates: ObjectIdSchema[];
}
