import date from 'api/utils/date';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PropertyValue } from '../template/PropertyValue';

type Props = {
  id: string;
  language: LanguageISO6391;
  metadata?: Record<string, PropertyValue>;
};

class EntityTranslation {
  id: string;

  language: LanguageISO6391;

  metadata: Record<string, PropertyValue>;

  constructor(props: Props) {
    this.id = props.id;
    this.metadata = props.metadata || {};
    this.language = props.language;
  }

  get properties(): Record<string, PropertyValue> {
    const commonProperties = ['title', 'creationDate', 'editDate'];

    return Object.entries(this.metadata).reduce(
      (acc, [key, value]) => (commonProperties.includes(key) ? acc : { ...acc, [key]: value }),
      {}
    );
  }

  get title() {
    return this.getValue('title');
  }

  get creationDate() {
    return this.getValue('creationDate');
  }

  get editDate() {
    return this.getValue('editDate');
  }

  setValue(propertyValue: PropertyValue) {
    const currentValue = this.metadata[propertyValue.name];
    if (!currentValue) {
      throw new Error(`Property ${propertyValue.name} does not exist in entity metadata`);
    }

    this.metadata[propertyValue.name] = propertyValue;
    this.editDate.value = [{ value: date.currentUTC() }];
  }

  getValue(name: string) {
    if (!this.metadata[name]) {
      throw new Error(`Property ${name} does not exist in entity metadata`);
    }

    return this.metadata[name];
  }
}

export { EntityTranslation };
export type { Props as EntityTranslationProps };
