import { ClientPropertySchema } from '#app/istore.js';
import { ClientIXExtractorType } from '#V2/shared/types.js';
import { TableSuggestion } from '#V2/Routes/Settings/IX/types.js';

interface SidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion?: TableSuggestion;
  onEntitySave: (suggestionId: string[], shouldUpdate: boolean) => any;
  property?: ClientPropertySchema;
  extractor?: ClientIXExtractorType;
}

export type { SidepanelProps };
