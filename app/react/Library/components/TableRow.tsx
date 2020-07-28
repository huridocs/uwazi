import React, { Component } from 'react';
import { connect } from 'react-redux';

import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import formatter from 'app/Metadata/helpers/formater';
import MarkdownViewer from 'app/Markdown';
import { I18NLink } from 'app/I18N';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';

interface TableRowProps {
  columns: PropertySchema[];
  document: any;
  storeKey: 'library' | 'uploads';
  selected?: boolean;
  onClick: any;
  templates: any;
  thesauris: any;
}

function formatProperty(prop: PropertySchema) {
  let result;
  if (prop === undefined || prop.value === undefined || prop.value === null) {
    return undefined;
  }
  switch (prop.type) {
    case 'multiselect':
    case 'multidaterange':
    case 'multidate':
      result = prop.value.map((p: any) => p.value).join(', ');
      break;
    case 'markdown':
      result = <MarkdownViewer markdown={prop.value} />;
      break;
    case 'image':
    case 'media':
      result = (
        <I18NLink key={prop.value} to={prop.value}>
          {prop.label}
        </I18NLink>
      );
      break;
    case 'link':
      result = (
        <I18NLink key={prop.value.url} to={prop.value.url}>
          {prop.value.label}
        </I18NLink>
      );
      break;
    case 'relationship':
      result = prop.value.map((p: any, index: number) => (
        <span>
          {index > 0 && ', '}
          <I18NLink key={p.url} to={p.url}>
            {p.value}
          </I18NLink>
        </span>
      ));
      break;
    case 'geolocation':
      result = <GeolocationViewer points={prop.value} onlyForCards />;
      break;
    default:
      result = JSON.stringify(prop.value);
      break;
  }
  return result;
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
  const property = document.metadata[column.get('name')]
    ? document.metadata[column.get('name')]
    : document[column.get('name')];
  let cellValue = property && property.value ? property.value : property;
  if (
    (column.get('type') === 'markdown' ||
      column.get('type') === 'image' ||
      column.get('type') === 'media' ||
      typeof cellValue !== 'string') &&
    cellValue !== undefined
  ) {
    cellValue = formatProperty(property);
  }
  return (
    <td className={!index ? 'sticky-col' : ''} key={index}>
      {!index && <input type="checkbox" checked={selected} onClick={onClick} />}
      {cellValue}
    </td>
  );
}

class TableRowComponent extends Component<TableRowProps> {
  constructor(props: TableRowProps) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }
  onClick(e: Event) {
    if (this.props.onClick && !window.getSelection()?.toString()) {
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
      <tr className={this.props.selected ? 'selected' : ''} onClick={this.onClick}>
        {this.props.columns.map((column: any, index: number) =>
          displayCell(
            formattedDocument,
            column,
            index,
            this.props.selected || false,
            this.onClick
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
