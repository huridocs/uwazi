/* eslint-disable max-statements */
import date from '#api/utils/date.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Id, IdProps } from '#api/core/libs/Id.js';
import stringify from 'fast-json-stable-stringify';
import {
  DateEntry,
  PropertyAssignment,
  PropertyValue,
  RelationshipPropertyAssignment,
  SelectPropertyAssignment,
  TextPropertyValue,
} from '../template/PropertyValue.js';
import { PropertyDoesNotExistError, PropertyTypeMismatchOnSetError } from './errors.js';
import { PropertyType } from '../template/PropertyType.js';

type Props = {
  language: LanguageISO6391;
  metadata?: Record<string, PropertyAssignment>;
  preview?: string;
} & IdProps;

class EntityTranslation {
  id: Id;

  language: LanguageISO6391;

  metadata: Record<string, PropertyAssignment>;

  preview?: string;

  constructor(props: Props) {
    this.id = new Id(props);
    this.metadata = props.metadata || {};
    this.language = props.language;
    this.preview = props.preview;
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

  get asDTO() {
    return {
      id: this.id.value,
      language: this.language,
      metadata: this.metadata,
      preview: this.preview,
    };
  }

  /** A copy with a new id; language-scoped values are re-stamped with the new language. */
  copyForLanguage(language: LanguageISO6391) {
    const metadata = Object.fromEntries(
      Object.entries(this.metadata).map(([name, assignment]) => [
        name,
        'language' in assignment ? { ...assignment, language } : { ...assignment },
      ])
    );

    return new EntityTranslation({ language, metadata, preview: this.preview });
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

    if (EntityTranslation.isSameAssignment(currentValue, propertyValue)) {
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

  // Assignments loaded from storage carry the row language; newly created ones only do for
  // language-scoped types, so the key is not part of the comparison.
  private static isSameAssignment(a: PropertyAssignment, b: PropertyAssignment) {
    const withoutLanguage = ({
      language: _language,
      ...rest
    }: PropertyAssignment & { language?: string }) => rest;
    return stringify(withoutLanguage(a)) === stringify(withoutLanguage(b));
  }

  // Replaces the assignment instead of mutating it: it is shared with the props the previous
  // version of the entity is rebuilt from.
  refreshEditDate(value = date.currentUTC()) {
    this.metadata = { ...this.metadata, editDate: { ...this.editDate, value: [{ value }] } };
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
