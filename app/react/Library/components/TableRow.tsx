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

function getLink(url: string, label: string) {
  return (
    <I18NLink key={url} to={url}>
      {label}
    </I18NLink>
  );
}

function formatProperty(prop: any) {
  let result = prop?.value;
  if (!result) {
    return typeof prop === 'string' ? prop : undefined;
  }
  if (['date', 'daterange', 'numeric', 'select', 'text', undefined].includes(prop.type)) {
    return result;
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
    case 'link':
      result = getLink(prop.value.url, prop.value.label);
      break;
    case 'relationship':
      result = prop.value.map((p: any, index: number) => (
        <span>
          {index > 0 && ', '}
          {getLink(p.url, p.value)}
        </span>
      ));
      break;
    case 'geolocation':
      result = <GeolocationViewer points={prop.value} onlyForCards />;
      break;
    default:
      result = undefined;
      break;
  }
  return result;
}

function formatDocument(document: any, templates: TemplateSchema[], thesauris: ThesaurusSchema[]) {
  let formattedDoc = document.toJS();
  const template = templates.find((t: TemplateSchema) => t.get('_id') === formattedDoc.template);
  formattedDoc.templateName = template?.get('name');
  formattedDoc = formatter.prepareMetadata(formattedDoc, templates, thesauris, null, {
    sortedProperty: 'creationDate',
  });
  formattedDoc.metadata.forEach((prop: any) => {
    formattedDoc[prop.name] = prop;
  });
  return formattedDoc;
}

function displayCell(document: any, column: any, index: number, firstColumnCheckbox: any) {
  const property = document[column.get('name')];
  const cellValue = formatProperty(property);
  return (
    <td className={!index ? 'sticky-col' : ''} key={index}>
      {firstColumnCheckbox(index)}
      {cellValue}
    </td>
  );
}

class TableRowComponent extends Component<TableRowProps> {
  constructor(props: TableRowProps) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(e: { preventDefault: () => void }) {
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

    const firstColumnCheckbox = (index: number) =>
      !index && (
        <input type="checkbox" checked={this.props.selected} onClick={this.onClick.bind(this)} />
      );

    return (
      <tr className={this.props.selected ? 'selected' : ''}>
        {this.props.columns.map((column: any, index: number) =>
          displayCell(formattedDocument, column, index, firstColumnCheckbox)
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
    templates: state.templates,
    thesauris: state.thesauris,
    onClick: state.onClick,
  };
}

export const TableRow = connect(mapStateToProps)(TableRowComponent);
