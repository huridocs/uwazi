import { BaseFile, BaseFileProps } from './BaseFile';

type Props = BaseFileProps & { entity: string };
export class Attachment extends BaseFile {
  readonly entity: string;

  protected _type = 'attachment' as const;

  constructor(props: Props) {
    const { entity, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
  }
}
