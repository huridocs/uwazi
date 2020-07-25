import React, { Component } from 'react';
import { connect } from 'react-redux';

import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import formatter from 'app/Metadata/helpers/formater';

interface TableRowProps {
  columns: PropertySchema[];
  document: any;
  storeKey: 'library' | 'uploads';
  selected?: boolean;
  onClick: any;
  templates: any;
  thesauris: any;
}

function formatDocument(document: any, templates: TemplateSchema[], thesauris: ThesaurusSchema[]) {
  let formattedDoc = document.toJS();
  const template = templates.find((t: TemplateSchema) => t.get('_id') === formattedDoc.template);
  if (template) {
    formattedDoc.templateName = template.get('name');
    const templateHasProperties =
      template.get('properties') !== undefined && template.get('properties').size > 0;
    if (templateHasProperties) {
      formattedDoc = formatter.prepareMetadata(formattedDoc, templates, thesauris, null, {
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
}

function displayCell(document: any, column: any, index: number, selected: boolean, onClick: any) {
  const cellValue = document.metadata[column.get('name')]
    ? document.metadata[column.get('name')].value
    : document[column.get('name')];
  return (
    <td className={!index ? 'sticky-col' : ''} key={index}>
      {!index && <input type="checkbox" checked={selected} onClick={onClick} />}
      {cellValue instanceof Object ? JSON.stringify(cellValue) : cellValue}
    </td>
  );
}

class TableRowComponent extends Component<TableRowProps> {
  onClick(e: any) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.document, this.props.selected);
    }
  }

  render() {
    const formattedDocument = formatDocument(
      this.props.document,
      this.props.templates,
      this.props.thesauris
    );

    return (
      <tr>
        {this.props.columns.map((column: any, index: number) =>
          displayCell(
            formattedDocument,
            column,
            index,
            this.props.selected || false,
            this.onClick.bind(this)
          )
        )}
      </tr>
    );
  }
}

function mapStateToProps(state: any, ownProps: TableRowProps) {
  const selected = ownProps.storeKey
    ? !!state[ownProps.storeKey].ui
        .get('selectedDocuments')
        .find((doc: any) => doc.get('_id') === ownProps.document.get('_id'))
    : false;
  return {
    selected,
    document: ownProps.document,
    columns: ownProps.columns,
  };
}

export const TableRow = connect(mapStateToProps)(TableRowComponent);
