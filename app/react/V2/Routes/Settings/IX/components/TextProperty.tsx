import React from 'react';
import { HandleTextSelection } from '@huridocs/react-text-selection-handler/dist';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../istore.js' or its corres... Remove this comment to see the full error message
import { ClientEntitySchema, ClientTemplateSchema } from '../../istore.js';

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
        // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
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
