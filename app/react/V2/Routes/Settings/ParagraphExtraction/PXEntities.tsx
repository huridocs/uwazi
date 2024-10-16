import React, { useEffect, useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as pxEntitiesApi from 'app/V2/api/paragraphExtractor/entities';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Table } from 'V2/Components/UI';
import { tableColumns } from './components/PXEntityTableElements';
import { TableTitle } from './components/TableTitle';
import { PXEntityTable, PXEntityApiResponse } from './types';
import { getTemplateName } from './utils/getTemplateName';

const formatExtractors = (
  entities: PXEntityApiResponse[],
  templates: ClientTemplateSchema[]
): PXEntityTable[] =>
  entities.map(extractor => {
    const templateName = getTemplateName(templates, extractor.templateId);

    return {
      ...extractor,
      rowId: extractor._id || '',
      templateName,
    };
  });

const PXEntityDashboard = () => {
  const [templatesFrom, setTemplatesFrom] = useState<string[]>([]);
  const { entities = [], templates } = useLoaderData() as {
    entities: PXEntityApiResponse[];
    templates: ClientTemplateSchema[];
  };

  const pxEntitiesData = useMemo(
    () => formatExtractors(entities, templates),
    [entities, templates]
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
    const [entities, templates] = await Promise.all([
      pxEntitiesApi.getByParagraphExtractorId(extractorId),
      templatesAPI.get(headers),
    ]);
    return { entities, templates };
  };

export { PXEntityDashboard, PXEntityLoader };
