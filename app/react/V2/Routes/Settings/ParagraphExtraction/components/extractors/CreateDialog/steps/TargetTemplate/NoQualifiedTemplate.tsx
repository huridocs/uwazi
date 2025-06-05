import { Translate } from 'app/I18N';
import React from 'react';

const NoQualifiedTemplatesMessage = () => (
  <div className="flex flex-col items-center gap-10 text-xs font-semibold uppercase lead">
    <p>
      <Translate className="text-gray-900">No valid target template available</Translate>
    </p>
    <p className="flex flex-col items-center gap-5 text-gray-500">
      <div id="label-template-requirements">
        <Translate>A target template needs to have the following properties</Translate>:
      </div>
      <ul
        className="flex flex-col gap-1 list-disc list-inside"
        aria-labelledby="label-template-requirements"
      >
        <li>
          1 <Translate translationKey="property markdown">Rich text</Translate>
        </li>
        <li>
          1 <Translate translationKey="property numeric">Numeric</Translate>
        </li>
      </ul>
    </p>
  </div>
);

export { NoQualifiedTemplatesMessage };
