import { DateTime, type DateTimeFormatOptions } from 'luxon';

type MetadataDisplayMode = 'compact' | 'rich';

type DisplayContext = {
  locale: string;
  dateFormat?: DateTimeFormatOptions;
  mode: MetadataDisplayMode;
};

const metadataDisplayPresets = {
  compact: { mode: 'compact' as const, dateFormat: DateTime.DATE_MED },
  rich: { mode: 'rich' as const, dateFormat: DateTime.DATE_MED },
};

export type { DisplayContext, MetadataDisplayMode };
export { metadataDisplayPresets };
