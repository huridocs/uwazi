import { dateToSeconds } from './dateToSeconds';
import { PropertySchema } from './types/commonTypes';

const stringToTypeOfProperty = (
  text: string | null,
  propertyType: PropertySchema['type'] | undefined
) => {
  if (!text) return text;

  const trimmedText = text.trim();
  switch (propertyType) {
    case 'numeric':
      return parseFloat(trimmedText) || null;
    case 'date':
      return dateToSeconds(trimmedText);
    default:
      return trimmedText;
  }
};

export { stringToTypeOfProperty };
