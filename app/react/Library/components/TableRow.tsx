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
  zoomLevel: number;
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
  if (['date', 'daterange', 'numeric', 'select', undefined].includes(prop.type)) {
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
        <React.Fragment>
          {index > 0 && ', '}
          {getLink(p.url, p.value)}
        </React.Fragment>
      ));
      break;
    case 'geolocation':
      result = <GeolocationViewer points={prop.value} onlyForCards />;
      break;
    default:
      result = prop.value === 'string' ? prop.value : undefined;
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

function displayCell(
  document: any,
  column: any,
  index: number,
  firstColumnCheckbox: any,
  zoomLevel: number
) {
  const property = document[column.get('name')];
  const cellValue = formatProperty(property);

  const otherColumn = (value: any) => (
    <div className={`table-view-cell table-view-row-zoom-${zoomLevel}`}>{value}</div>
  );
  const firstColumn = (value: any) => (
    <div>
      {firstColumnCheckbox(index)}
      {otherColumn(value)}
    </div>
  );

  return (
    <td className={!index ? 'sticky-col' : ''} key={index}>
      {!index ? firstColumn(cellValue) : otherColumn(cellValue)}
    </td>
  );
}

class TableRowComponent extends Component<TableRowProps> {
  constructor(props: TableRowProps) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.firstColumnCheckbox = this.firstColumnCheckbox.bind(this);
  }

  onClick(e: { preventDefault: () => void }) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.document, this.props.selected);
    }
  }

  firstColumnCheckbox(index: number) {
    return (
      !index && (
        <input type="checkbox" checked={this.props.selected} onClick={this.onClick.bind(this)} />
      )
    );
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
            this.firstColumnCheckbox,
            this.props.zoomLevel
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
    templates: state.templates,
    thesauris: state.thesauris,
  };
}

export const TableRow = connect(mapStateToProps)(TableRowComponent);
