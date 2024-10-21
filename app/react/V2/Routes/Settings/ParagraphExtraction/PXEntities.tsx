import React, { useEffect, useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as pxEntitiesApi from 'app/V2/api/paragraphExtractor/entities';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Table } from 'V2/Components/UI';
import { RequestParams } from 'app/utils/RequestParams';
import { I18NApi } from 'app/I18N';
import { LanguageSchema } from 'shared/types/commonTypes';
import { tableColumns } from './components/PXEntityTableElements';
import { TableTitle } from './components/TableTitle';
import { PXEntityTable, PXEntityApiResponse } from './types';
import { getTemplateName } from './utils/getTemplateName';

const formatEntityData = (
  entities: PXEntityApiResponse[],
  templates: ClientTemplateSchema[],
  languagePool: LanguageSchema[]
): PXEntityTable[] =>
  entities.map(entity => {
    const templateName = getTemplateName(templates, entity.templateId);
    const languages = entity.languages.map(language => {
      const { label = language } = languagePool.find(pool => pool.key === language) || {};
      return label;
    });
    return {
      ...entity,
      rowId: entity._id || '',
      templateName,
      languages,
    };
  });

const PXEntityDashboard = () => {
  const [templatesFrom, setTemplatesFrom] = useState<string[]>([]);
  const {
    entities = [],
    templates,
    languages = [],
  } = useLoaderData() as {
    entities: PXEntityApiResponse[];
    templates: ClientTemplateSchema[];
    languages: LanguageSchema[];
  };

  const pxEntitiesData = useMemo(
    () => formatEntityData(entities, templates, languages),
    [entities, templates, languages]
  );

  useEffect(() => {
    const uniqueTemplateNames = [...new Set(pxEntitiesData.map(datum => datum.templateName))];
    setTemplatesFrom(uniqueTemplateNames.filter(Boolean));
  }, [pxEntitiesData]);

  return (
    <div
      className="tw-content"
      data-testid="settings-paragraph-extractor"
      style={{ width: '100%', overflowY: 'auto' }}
    >
      <SettingsContent>
        <SettingsContent.Header
          title="Entities"
          path={new Map([['Paragraph extraction', '/settings/paragraph-extraction']])}
        />
        <SettingsContent.Body>
          <Table
            data={pxEntitiesData}
            columns={tableColumns}
            header={<TableTitle items={templatesFrom} />}
            defaultSorting={[{ id: '_id', desc: false }]}
          />
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

const PXEntityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId = '' } }) => {
    const [entities, templates, languages] = await Promise.all([
      pxEntitiesApi.getByParagraphExtractorId(extractorId),
      templatesAPI.get(headers),
      I18NApi.getLanguages(new RequestParams({}, headers)),
    ]);
    return { entities, templates, languages };
  };

export { PXEntityDashboard, PXEntityLoader };
