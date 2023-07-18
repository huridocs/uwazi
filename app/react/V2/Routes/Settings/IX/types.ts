import { IXExtractorInfo } from 'V2/shared/types';
import { PropertySchema } from 'shared/types/commonTypes';

interface IXProperty extends PropertySchema {
  type: 'text' | 'date' | 'numeric' | 'markdown';
}

type Extractor = IXExtractorInfo & {
  namedTemplates: string[];
  propertyLabel: string;
  propertyType: IXProperty['type'];
};

export type { Extractor };
