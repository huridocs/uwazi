import React from 'react';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { PXParagraphTable } from '../types';
import { DisplayPills } from './DisplayPills';

const ViewParagraph = ({ paragraphData }: { paragraphData: PXParagraphTable }) => (
  <div className="mb-6 flex flex-col gap-3">
    <div className="px-4 py-3 rounded-md bg-gray-50 text-sm font-bold flex justify-between">
      <div>
        <Translate>Entity title</Translate> - #{paragraphData._id} -{' '}
        {paragraphData.languages.join(', ')}
      </div>
      <div className="bg-gray-100 text-xs font-medium p-1 rounded-md">
        {paragraphData.templateName}
      </div>
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      <Translate>ID</Translate>:
      <Link to={`/document/${paragraphData.document}`} className="underline">
        {paragraphData.document}
      </Link>
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      <Translate>Language</Translate>: <DisplayPills items={paragraphData.languages} />
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      <Translate>Paragraph</Translate>: {paragraphData.paragraphCount}
    </div>
    <div className="px-4 py-3 rounded-md border border-gray-100 flex flex-col gap-2">
      <div className="leading-tight text-sm font-bold">
        <Translate>Text</Translate>
      </div>
      <div className="text-sm text-gray-900 leading-[21px]">{paragraphData.text}</div>
    </div>
  </div>
);

export { ViewParagraph };
