import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as ixAPI from 'V2/api/ix';
import * as templatesAPI from 'V2/api/templates';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { ClientTemplateSchema } from 'app/istore';
import { Table } from 'V2/Components/UI';
import { Translate, t } from 'app/I18N';
import { IXExtractorInfo } from './types';
import { TableData, tableColumns } from './components/TableElements';

const formatExtractors = (extractors: IXExtractorInfo[], templates: ClientTemplateSchema[]) =>
  extractors.map(extractor => {
    let propertyType: TableData['propertyType'] = 'text';
    let propertyLabel = t('System', 'Title', null, false);

    const namedTemplates = extractor.templates.map(extractorTemplate => {
      const templateName =
        templates.find(template => template._id === extractorTemplate)?.name || extractorTemplate;
      return templateName;
    });

    templates.forEach(template => {
      const property = template.properties.find(
        templateProperty => templateProperty.name === extractor.property
      );

      if (property) {
        propertyType = property.type as TableData['propertyType'];
        propertyLabel = t(template._id, property.label, null, false);
      }
    });

    return { ...extractor, templates: namedTemplates, propertyType, propertyLabel };
  });

const IXDashboard = () => {
  const { extractors, templates } = useLoaderData() as {
    extractors: IXExtractorInfo[];
    templates: ClientTemplateSchema[];
  };

  const formmatedExtractors = formatExtractors(extractors, templates);

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title="Metadata extraction dashboard" />

        <SettingsContent.Body>
          <Table<TableData>
            data={formmatedExtractors}
            columns={tableColumns}
            title={<Translate>Extractors</Translate>}
            enableSelection
            initialState={{ sorting: [{ id: 'name', desc: false }] }}
          />
        </SettingsContent.Body>

        <SettingsContent.Footer>footer</SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

const dashboardLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const extractors = await ixAPI.getExtractors(headers);
    const templates = await templatesAPI.get(headers);
    return { extractors, templates };
  };

export { IXDashboard, dashboardLoader };
