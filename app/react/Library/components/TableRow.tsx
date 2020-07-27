import React, { Component } from 'react';
import { connect } from 'react-redux';

import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import formatter from 'app/Metadata/helpers/formater';
import MarkdownViewer from 'app/Markdown';
import { I18NLink } from 'app/I18N';
import { Icon } from 'app/Layout';
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
  switch (prop.type) {
    case 'multiselect':
    case 'multidaterange':
    case 'multidate':
      result = prop.value.map((p: any) => p.value).join(', ');
      break;
    case 'markdown':
    case 'media':
      result = <MarkdownViewer markdown={prop.value} true />;
      break;
    case 'image':
    case 'link':
      result = (
        <I18NLink key={prop.url} to={prop.url}>
          {prop.icon && <Icon className="item-icon" data={prop.icon} />}
          {prop.value}
        </I18NLink>
      );
      break;
    case 'geolocation':
      result = <GeolocationViewer points={prop.value} onlyForCards={Boolean(prop.onlyForCards)} />;
      break;
    case 'relationship':
    default:
      result = prop.value;
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
  let cellValue;
  if (property && typeof property.value === 'object') {
    cellValue = formatProperty(property);
  } else {
    cellValue = property && property.value ? property.value : property;
  }
  return (
    <td className={!index ? 'sticky-col' : ''} key={index}>
      {!index && <input type='checkbox' checked={selected} onClick={onClick} />}
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
      <tr className={this.props.selected ? 'selected' : ''}>
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
