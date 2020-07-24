import React from 'react';

import { connect } from 'react-redux';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';
import formatter from '../Metadata/helpers/formater';
import { TableRow } from 'app/Library/components/TableRow';

export interface DocumentViewerProps {
  rowListZoomLevel: number;
  documents: any;
  storeKey: 'library' | 'uploads';
  clickOnDocument: (...args: any[]) => any;
  onSnippetClick: (...args: any[]) => any;
  deleteConnection: (...args: any[]) => any;
  search: any;
  templates: any;
  thesauris: any;
}

function formatDocuments(data: any, templates: TemplateSchema[], props: DocumentViewerProps) {
  return data.map((doc: any) => {
    let formattedDoc = doc;
    const template = templates.find((t: TemplateSchema) => t._id === doc.template);
    if (template) {
      formattedDoc.templateName = template.name;
      const templateHasProperties =
        template.properties !== undefined && template.properties.length > 0;
      if (templateHasProperties) {
        formattedDoc = formatter.prepareMetadata(doc, props.templates, props.thesauris, null, {
          sortedProperty: 'creationDate',
        });
        const metadata: { [key: string]: any } = {};
        formattedDoc.metadata.forEach((prop: any) => {
          metadata[prop.name] = prop;
        });
        formattedDoc.metadata = metadata;
      }
    }
    formattedDoc.metadata = formattedDoc.metadata || {};
    return formattedDoc;
  });
}

function columnsFromTemplates(templates: TemplateSchema[]) {
  return templates.reduce((properties: PropertySchema[], template: TemplateSchema) => {
    const propsToAdd: PropertySchema[] = [];
    (template.properties || []).forEach(templateProperty => {
      if (!properties.find(columnProperty => templateProperty.name === columnProperty.name)) {
        propsToAdd.push(templateProperty);
      }
    });
    return properties.concat(propsToAdd);
  }, []);
}

function TableView(props: DocumentViewerProps) {
  const data = props.documents.get('rows').toJS();
  const templateIds = props.documents
    .getIn(['aggregations', 'all', '_types', 'buckets'])
    .filter((template: any) => template.getIn(['filtered', 'doc_count']) > 0)
    .map((template: any) => template.get('key'))
    .toJS();

  const templates = props.templates
    .filter((t: TemplateSchema) => templateIds.includes(t.get('_id')))
    .toJS();

  const documents = formatDocuments(data, templates, props);
  const commonColumns = [
    ...templates[0].commonProperties,
    { label: 'Template', name: 'templateName' },
  ];
  const columns = commonColumns.concat(columnsFromTemplates(templates));

  return (
    <div className="tableview-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column: any, index: number) => (
              <th className={!index ? 'sticky-col' : ''} key={index}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documents.map((document: any, index: number) => (
            <TableRow {...{document, columns, key: index}} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const mapStateToProps = (state: any) => ({
  templates: state.templates,
  thesauris: state.thesauris,
});

export const TableViewer = connect(mapStateToProps)(TableView);
