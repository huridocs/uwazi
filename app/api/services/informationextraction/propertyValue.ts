import moment from 'moment';
import { ensure } from 'shared/tsUtils';
import { PropertyTypeSchema } from 'shared/types/commonTypes';
import { propertyTypes } from 'shared/propertyTypes';

type EntityValue = { value?: string; label?: string };

type DeriveParams = {
  currentValue?: unknown;
  selectionText?: string | undefined;
  entityValues?: EntityValue[] | undefined;
};

// Returns either a string (for text/date/etc.) or an array of id/label pairs for select-like types
export function deriveTrainingPropertyValue(
  targetPropertyType: PropertyTypeSchema,
  { currentValue, selectionText, entityValues }: DeriveParams
): string | Array<{ value: string; label: string }> {
  const isSelectLike =
    targetPropertyType === propertyTypes.select ||
    targetPropertyType === propertyTypes.multiselect ||
    targetPropertyType === propertyTypes.relationship;

  if (isSelectLike) {
    const values = entityValues || [];
    return values.map(v => ({
      value: ensure<string>(v.value || ''),
      label: ensure<string>(v.label || ''),
    }));
  }
  // Non-select-like properties
  let val: string | undefined;
  if (currentValue != null && currentValue !== '') {
    val = String(currentValue);
    if (targetPropertyType === 'date') {
      const maybeEpoch = Number(val);
      if (!Number.isNaN(maybeEpoch)) {
        val = moment(maybeEpoch * 1000)
          .utc()
          .format('YYYY-MM-DD');
      }
    }
  } else if (selectionText) {
    val = selectionText;
  } else {
    val = '';
  }

  return val;
}
