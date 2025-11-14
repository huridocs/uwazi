import { BaseFile, BaseFileProps } from './BaseFile';

export type BaseDocumentProps = BaseFileProps & {
  entity: string;
};

export abstract class BaseDocument extends BaseFile {
  readonly entity: string;

  protected _type = 'document' as const;

  constructor(props: BaseDocumentProps) {
    const { entity, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
  }
}
