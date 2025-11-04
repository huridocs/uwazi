import { BaseFile, BaseFileProps } from './BaseFile';

type Props = BaseFileProps & { entity: string };
export class Attachment extends BaseFile {
  readonly entity: string;

  constructor(props: Props) {
    const { entity, ...baseProps } = props;
    super(baseProps);
    this.entity = entity;
  }
}
