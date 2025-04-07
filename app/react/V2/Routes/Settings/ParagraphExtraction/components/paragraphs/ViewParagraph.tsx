import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'app/I18N';
import { DisplayPill } from '../DisplayPills';
import { TablePXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';

const ViewParagraph = ({ paragraphData }: { paragraphData: TablePXEntityParagraphRow }) => (
  <div className="mb-6 flex flex-col gap-3">
    <div className="px-4 py-3 rounded-md bg-gray-50 text-sm font-bold flex justify-between">
      <div>
        <Translate>Entity title</Translate> : {paragraphData.sharedId}
      </div>
      <div>
        {/* <DisplayPill color={paragraphData.template.color}>
        {paragraphData.template.name}
        </DisplayPill> */}
        <DisplayPill color={'blue'}>{paragraphData.sharedId}</DisplayPill>
      </div>
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      <Translate>Language</Translate>:{' '}
      <DisplayPill>{paragraphData.entities[0].language}</DisplayPill>
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      <Translate>ID</Translate>:{' '}
      <Link to={`/document/${paragraphData.sharedId}`} className="underline">
        {paragraphData.sharedId}
      </Link>
    </div>
    <div className="px-4 py-3 rounded-md leading-tight text-sm font-bold border border-gray-100">
      <Translate>Paragraph</Translate>: {paragraphData.sharedId}
    </div>
    <div className="px-4 py-3 rounded-md border border-gray-100 flex flex-col gap-2">
      <div className="leading-tight text-sm font-bold">
        <Translate>Text</Translate>
      </div>
      <div className="text-sm text-gray-900 leading-[21px]">{paragraphData.sharedId}</div>
    </div>
  </div>
);

export { ViewParagraph };
