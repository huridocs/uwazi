import { ClientPropertySchema } from '#app/istore.js';
import { ClientIXExtractorType } from '#V2/shared/types.js';
import { TableSuggestion } from '../../types.js';

interface SidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion?: TableSuggestion;
  onEntitySave: (suggestionId: string[], shouldUpdate: boolean) => any;
  property?: ClientPropertySchema;
  extractor?: ClientIXExtractorType;
}

export type { SidepanelProps };
