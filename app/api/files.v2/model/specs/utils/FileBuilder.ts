import { Readable } from 'stream';
import { File, FileProps } from '../../File';

type FileBuilderProps = FileProps;

export class FileBuilder {
  private constructor(private props: FileBuilderProps) {}

  static create(props?: Partial<FileBuilderProps>) {
    const defaultProps: FileBuilderProps = {
      filename: 'default.txt',
      source: Readable.from([Buffer.from('default content')]),
    };
    return new FileBuilder({ ...defaultProps, ...props });
  }

  withFilename(filename: string) {
    this.props.filename = filename;
    return this;
  }

  withContent(content: string) {
    this.props.source = Readable.from([Buffer.from(content)]);
    return this;
  }

  build() {
    return new File(this.props);
  }
}
