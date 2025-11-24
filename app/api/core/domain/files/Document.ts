import { BaseDocument, BaseDocumentProps } from './BaseDocument';

type Props = BaseDocumentProps & {
  status: 'processing' | 'failed';
};

export class Document extends BaseDocument {
  status: 'processing' | 'failed';

  constructor(props: Props) {
    const { status, ...baseProps } = props;
    super(baseProps);
    this.status = status;
  }

  failed() {
    this.status = 'failed';
  }
}
