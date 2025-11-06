/* eslint-disable max-statements */
import date from 'api/utils/date';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import {
  DateEntry,
  PropertyAssignment,
  PropertyValue,
  RelationshipPropertyAssignment,
  SelectPropertyAssignment,
  TextPropertyValue,
} from '../template/PropertyValue';

type Props = {
  id: string;
  language: LanguageISO6391;
  metadata?: Record<string, PropertyAssignment>;
};

class EntityTranslation {
  id: string;

  language: LanguageISO6391;

  metadata: Record<string, PropertyAssignment>;

  constructor(props: Props) {
    this.id = props.id;
    this.metadata = props.metadata || {};
    this.language = props.language;
  }

  get properties(): Record<string, PropertyAssignment> {
    const commonProperties = ['title', 'creationDate', 'editDate'];

    return Object.entries(this.metadata).reduce(
      (acc, [key, value]) => (commonProperties.includes(key) ? acc : { ...acc, [key]: value }),
      {}
    );
  }

  get title() {
    return this.getValue<TextPropertyValue>('title');
  }

  get creationDate() {
    return this.getValue<DateEntry>('creationDate');
  }

  get editDate() {
    return this.getValue<DateEntry>('editDate');
  }

  setValue(propertyValue: PropertyAssignment) {
    const currentValue = this.metadata[propertyValue.name];
    if (!currentValue) {
      throw new Error(`Property ${propertyValue.name} does not exist in entity metadata`);
    }

    if (currentValue.type !== propertyValue.type) {
      throw new Error(
        `Cannot change the type of property ${propertyValue.name} from ${currentValue.type} to ${propertyValue.type}`
      );
    }

    if (JSON.stringify(currentValue) === JSON.stringify(propertyValue)) {
      return;
    }

    if (
      ['select', 'multiselect', 'relationship'].includes(propertyValue.type) &&
      this.language !==
        (propertyValue as SelectPropertyAssignment | RelationshipPropertyAssignment).language
    ) {
      return;
    }

    this.metadata[propertyValue.name] = propertyValue;
    this.editDate.value = [{ value: date.currentUTC() }];
  }

  getValue<Value = PropertyValue>(name: string): PropertyAssignment<Value> {
    if (!this.metadata[name]) {
      throw new Error(`Property ${name} does not exist in entity metadata`);
    }

    return this.metadata[name] as unknown as PropertyAssignment<Value>;
  }
}

export { EntityTranslation };
export type { Props as EntityTranslationProps };
