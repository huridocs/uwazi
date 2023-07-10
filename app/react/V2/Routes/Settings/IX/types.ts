import { PropertySchema } from 'shared/types/commonTypes';

interface IXProperty extends PropertySchema {
  type: 'text' | 'numeric' | 'date';
}
interface IXExtractorInfo {
  _id?: string;
  name: string;
  property: string;
  templates: string[];
}

type Extractor = IXExtractorInfo & {
  namedTemplates: string[];
  propertyLabel: string;
  propertyType: IXProperty['type'];
};

export type { IXExtractorInfo, Extractor, IXProperty };
