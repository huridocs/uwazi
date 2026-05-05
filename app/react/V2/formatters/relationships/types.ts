interface EntityReference {
  readonly _id: string;
  readonly hub: string;
  readonly file: string;
  readonly reference: {
    readonly selectionRectangles?: Array<{
      readonly top?: number;
      readonly left?: number;
      readonly width?: number;
      readonly height?: number;
      readonly page?: string;
    }>;
    readonly text?: string;
  };
  readonly targetEntity: {
    readonly _id: string;
    readonly sharedId: string;
    readonly title: string;
    readonly templateId: string;
  };
}

export type { EntityReference };
