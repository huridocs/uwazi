import { BaseFile, BaseFileProps } from './BaseFile';

type Props = BaseFileProps & { entity: string; url: string };

export class URLAttachment extends BaseFile {
  readonly url: string;

  readonly entity: string;

  constructor(props: Props) {
    const { entity, url, ...baseProps } = props;
    super(baseProps);
    this.url = url;
    this.entity = entity;
  }
}
