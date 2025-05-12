/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface IXSelectionSource {
  type: 'file' | 'entity_property';
  id: string;
  propertyName?: string;
}

export interface IXSelections {
  language: string;
  source: IXSelectionSource;
  selections: {
    name?: string;
    propertyID?: string;
    timestamp?: string;
    selection: {
      text: string;
      selectionRectangles?: {
        top: number;
        left: number;
        width: number;
        height: number;
        page?: string;
      }[];
    };
  }[];
}
