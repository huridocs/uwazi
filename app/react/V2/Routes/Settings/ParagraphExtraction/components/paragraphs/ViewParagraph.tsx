import React from 'react';
import { useLoaderData } from 'react-router';
import { useAtomValue } from 'jotai';

import { Translate } from '#app/I18N/index.js';

import { availableLanguages } from '#shared/language/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import {
  PXParagraphLoaderResponse,
  TablePXEntityParagraphRow,
} from '#shared/ParagraphExtractionTypes.ts';
import { DisplayPill } from '#V2/Routes/Settings/ParagraphExtraction/components/DisplayPills.jsx';

const ViewParagraph = ({ paragraphData }: { paragraphData: TablePXEntityParagraphRow }) => {
  const { sourceEntity } = useLoaderData() as PXParagraphLoaderResponse;
  const templates = useAtomValue(templatesAtom);
  const paragraphTemplate = templates.find(template => template._id === paragraphData.template);
  const language = availableLanguages.find(lang => lang.key === paragraphData.language);

  const sourceDocument =
    sourceEntity?.documents?.find(document => document.language === language?.ISO639_3) ||
    (sourceEntity?.documents && sourceEntity.documents[0]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md bg-gray-50 text-sm font-bold flex gap-2 justify-between p-3">
        <div>{paragraphData.title}</div>
        <div>
          <DisplayPill color={paragraphTemplate?.color}>
            <Translate context={paragraphTemplate?._id}>{paragraphTemplate?.name}</Translate>
          </DisplayPill>
        </div>
      </div>
      <div className="rounded-md leading-tight text-sm font-bold border border-gray-100 p-3">
        <Translate>Language</Translate>: {language?.localized_label}
      </div>
      <div className="rounded-md leading-tight text-sm font-bold border border-gray-100 p-3">
        this comment to see the full error message
        <Translate>Document</Translate>: {sourceDocument?.originalname}
      </div>
      <div className="rounded-md leading-tight text-sm font-bold border border-gray-100 p-3">
        <Translate>Paragraph</Translate>: {paragraphData.paragraphNumber}
      </div>
      <div className="grow rounded-md border border-gray-100 flex flex-col gap-2 p-3">
        <div className="leading-tight text-sm font-bold">
          <Translate>Text</Translate>
        </div>
        <div className="text-sm text-gray-900 leading-[21px]">{paragraphData.paragraphText}</div>
      </div>
    </div>
  );
};

export { ViewParagraph };
