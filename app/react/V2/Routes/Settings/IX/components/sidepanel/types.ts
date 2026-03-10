import { ClientPropertySchema } from 'app/istore';
import { ClientIXExtractorType } from 'V2/shared/types';
import { TableSuggestion } from '../../types';

interface SidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion?: TableSuggestion;
  onEntitySave: (suggestionId: string[], shouldUpdate: boolean) => any;
  property?: ClientPropertySchema;
  extractor?: ClientIXExtractorType;
}

export type { SidepanelProps };
