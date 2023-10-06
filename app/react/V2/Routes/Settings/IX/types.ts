import { IXExtractorInfo } from 'V2/shared/types';
import { PropertySchema } from 'shared/types/commonTypes';
import { TextHighlight } from 'V2/Components/PDFViewer/types';

interface IXProperty extends PropertySchema {
  type: 'text' | 'date' | 'numeric' | 'markdown';
}

type Extractor = IXExtractorInfo & {
  namedTemplates: string[];
  propertyLabel: string;
  propertyType: IXProperty['type'];
};

type Highlights = { [page: string]: TextHighlight[] };

export type { Extractor, Highlights };
