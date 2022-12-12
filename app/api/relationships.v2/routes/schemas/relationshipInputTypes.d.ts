/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

/**
 * @minItems 1
 */
export type RelationshipInputArrayType = [RelationshipInputType, ...RelationshipInputType[]];

export interface RelationshipInputType {
  from:
    | string
    | {
        entity: string;
        file: string;
        selections: {
          page: number;
          top: number;
          left: number;
          width: number;
          height: number;
        }[];
        text: string;
      };
  to:
    | string
    | {
        entity: string;
        file: string;
        selections: {
          page: number;
          top: number;
          left: number;
          width: number;
          height: number;
        }[];
        text: string;
      };
  type: string;
}
