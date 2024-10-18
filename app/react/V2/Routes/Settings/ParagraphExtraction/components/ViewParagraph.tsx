import React from 'react';
import { Link } from 'react-router-dom';
import { PXParagraphApiResponse } from '../types';
import { DisplayPills } from './DisplayPills';

const ViewParagraph = ({ paragraphData }: { paragraphData: PXParagraphApiResponse }) => (
  <div className="mb-6 flex flex-col gap-3 font-inter">
    <div className="px-4 py-3 rounded-md bg-gray-50 text-sm font-bold flex justify-between">
      <div>
        Entity title - #{paragraphData._id} - {paragraphData.languages.join(', ')}
      </div>
      <div className="bg-gray-100 text-xs font-medium p-1 rounded-md">Cases</div>
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      ID:{' '}
      <Link to={`/document/${paragraphData.document}`} className="underline">
        {paragraphData.document}
      </Link>
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      Language: <DisplayPills items={paragraphData.languages} />
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      Paragraph: {paragraphData.paragraphCount}
    </div>
    <div className="px-4 py-3 rounded-md border border-gray-100 flex flex-col gap-2">
      <div className="leading-tight text-sm font-bold">Text</div>
      <div className="text-sm text-gray-900 leading-[21px]">{paragraphData.text}</div>
    </div>
  </div>
);

export { ViewParagraph };
