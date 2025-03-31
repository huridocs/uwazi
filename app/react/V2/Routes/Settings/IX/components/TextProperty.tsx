import React from 'react';
import { HandleTextSelection } from '@huridocs/react-text-selection-handler/dist';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';

type TextPropertyProps = {
  onSelect: (selection: TextSelection) => any;
  onDeselect: () => any;
  propertyName?: string;
  entity?: ClientEntitySchema;
  template?: ClientTemplateSchema;
  className?: string;
};

const TextProperty = ({
  onSelect,
  onDeselect,
  propertyName,
  entity,
  template,
  className = '',
}: TextPropertyProps) => {
  if (!propertyName) {
    return undefined;
  }

  const label =
    propertyName === 'title' ? (
      <Translate>Title</Translate>
    ) : (
      <Translate context={template?._id.toString()}>
        {template?.properties?.find(property => property.name === propertyName)?.label}
      </Translate>
    );

  let value = entity?.title;

  if (propertyName !== 'title') {
    const metadataProperty =
      entity?.metadata && entity.metadata[propertyName] && entity.metadata[propertyName][0];
    value = (typeof metadataProperty?.value === 'string' && metadataProperty.value) || undefined;
  }

  return (
    <dl>
      <div className={`flex flex-col gap-2 ${className}`}>
        <dt className="font-semibold not-italic text-black">{label}</dt>
        <HandleTextSelection onSelect={onSelect} onDeselect={onDeselect}>
          <dd>{value || <Translate>No value</Translate>}</dd>
        </HandleTextSelection>
      </div>
    </dl>
  );
};

export { TextProperty };
