/* eslint-disable max-statements */
import date from 'api/utils/date';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Id, IdProps } from 'api/core/libs/Id';
import {
  DateEntry,
  PropertyAssignment,
  PropertyValue,
  RelationshipPropertyAssignment,
  SelectPropertyAssignment,
  TextPropertyValue,
} from '../template/PropertyValue';
import { PropertyDoesNotExistError, PropertyTypeMismatchOnSetError } from './errors';
import { PropertyType } from '../template/PropertyType';

type Props = {
  language: LanguageISO6391;
  metadata?: Record<string, PropertyAssignment>;
} & IdProps;

class EntityTranslation {
  id: Id;

  language: LanguageISO6391;

  metadata: Record<string, PropertyAssignment>;

  constructor(props: Props) {
    this.id = new Id(props);
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

  mergeMetadata(newMetadata: Record<string, PropertyAssignment>) {
    Object.values(this.metadata).forEach(propertyAssignment => {
      const ofSameName = newMetadata[propertyAssignment.name];
      const differentType = ofSameName?.type !== propertyAssignment.type;

      if ((ofSameName && differentType) || !ofSameName) {
        delete this.metadata[propertyAssignment.name];
      }
    });

    this.metadata = { ...newMetadata, ...this.metadata };
  }

  setValue(propertyValue: PropertyAssignment) {
    const currentValue = this.metadata[propertyValue.name];
    if (!currentValue) {
      throw new PropertyDoesNotExistError(propertyValue.name);
    }

    if (currentValue.type !== propertyValue.type) {
      throw new PropertyTypeMismatchOnSetError(
        propertyValue.name,
        currentValue.type,
        propertyValue.type
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
    this.refreshEditDate();
  }

  refreshEditDate(value = date.currentUTC()) {
    this.editDate.value = [{ value }];
  }

  getValue<Value = PropertyValue>(name: string): PropertyAssignment<Value> {
    if (!this.metadata[name]) {
      throw new PropertyDoesNotExistError(name);
    }

    return this.metadata[name] as unknown as PropertyAssignment<Value>;
  }

  getByType(type: PropertyType[]): PropertyAssignment[] {
    return Object.values(this.metadata).filter(pa => type.includes(pa.type));
  }
}

export { EntityTranslation };
export type { Props as EntityTranslationProps };
