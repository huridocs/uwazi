import { Property } from 'api/core/domain/template/Property';
import { CommonProperty } from 'api/core/domain/template/CommonProperty';
import { Template } from 'api/core/domain/template/Template';
import { CreationDateProperty } from '../CreationDateProperty';
import { ModifiedDateProperty } from '../ModifiedDateProperty';
import { TitleProperty } from '../TitleProperty';

class TemplateBuilder {
  private _id: string = 'template-id-builder';

  private _name: string = 'Template Name';

  private _properties: Property[] = [];

  private _commonProperties: CommonProperty[] | undefined;

  private _color: string = '#FFFFFF';

  private _isDefault?: boolean;

  private _entityViewPage: string = '';

  private constructor() {}

  static aTemplate(props: Partial<Template> = {}): TemplateBuilder {
    const builder = new TemplateBuilder();

    if (props.id) builder.withId(props.id);
    if (props.name) builder.withName(props.name);
    if (props.properties) builder.withProperties(props.properties);
    if (props.commonProperties) builder.withCommonProperties(props.commonProperties);
    if (props.color) builder.withColor(props.color);
    if (props.isDefault) builder.withDefault(props.isDefault);
    if (props.entityViewPage) builder.withEntityViewPage(props.entityViewPage);

    return builder;
  }

  static from(template: Template): TemplateBuilder {
    const builder = new TemplateBuilder();

    builder.withId(template.id);
    builder.withName(template.name);
    builder.withProperties([...template.properties]);
    builder.withCommonProperties([...template.commonProperties]);
    if (template.color) {
      builder.withColor(template.color);
    }
    builder.withDefault(template.isDefault);

    return builder;
  }

  withId(id: string): this {
    this._id = id;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withProperties(properties: Property[]): this {
    this._properties = properties;
    return this;
  }

  withCommonProperties(commonProperties: CommonProperty[]): this {
    this._commonProperties = commonProperties;
    return this;
  }

  withColor(color: string): this {
    this._color = color;
    return this;
  }

  withDefault(isDefault?: boolean): this {
    this._isDefault = isDefault;
    return this;
  }

  withEntityViewPage(entityViewPage: string): this {
    this._entityViewPage = entityViewPage;
    return this;
  }

  build(): Template {
    const commonProperties = this._commonProperties ?? [
      new TitleProperty({
        id: 'builder-title-prop',
        label: 'Title',
        template: this._id,
      }),
      new CreationDateProperty({
        id: 'builder-creation-date-prop',
        label: 'Date added',
        template: this._id,
      }),
      new ModifiedDateProperty({
        id: 'builder-modified-date-prop',
        label: 'Date modified',
        template: this._id,
      }),
    ];

    return new Template(
      this._id,
      this._name,
      this._properties,
      commonProperties,
      this._color,
      this._isDefault,
      this._entityViewPage
    );
  }
}

export { TemplateBuilder };
