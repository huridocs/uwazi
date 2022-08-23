import date from 'api/utils/date';
import { PropertySchema } from './types/commonTypes';

const stringToTypeOfProperty = (
  text: string | null,
  propertyType: PropertySchema['type'] | undefined,
  language?: string
) => {
  if (!text) return text;

  const trimmedText = text.trim();
  switch (propertyType) {
    case 'numeric':
      return parseFloat(trimmedText) || null;
    case 'date':
      return date.dateToSeconds(trimmedText, language);
    default:
      return trimmedText;
  }
};

export { stringToTypeOfProperty };
