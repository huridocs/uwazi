import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {formater} from 'app/Metadata';
import marked from 'marked';
import t from '../I18N/t';

import {RowList, ItemFooter, ItemName} from './Lists';
import Icon from './Icon';
import TemplateLabel from './TemplateLabel';
import PrintDate from './PrintDate';

export class Item extends Component {

  formatMetadata(populatedMetadata, creationDate, translationContext) {
    let metadata = populatedMetadata
    .filter(p => p.showInCard && (p.value && p.value.length > 0 || p.markdown))
    .map((property, index) => {
      let value = typeof property.value !== 'object' ? property.value : property.value.map(d => d.value).join(', ');
      if (property.markdown) {
        value = <div className="markdownViewer" dangerouslySetInnerHTML={{__html: marked(property.markdown, {sanitize: true})}}/>;
      }
      return (
        <dl key={index}>
          <dt>{t(translationContext, property.label)}</dt>
          <dd><Icon className="item-icon item-icon-center" data={property.icon} />{value}</dd>
        </dl>
      );
    });

    let creationMetadata = <dl><dt><i>Upload date</i></dt><dd><PrintDate utc={creationDate} toLocal={true} /></dd></dl>;

    return metadata.length || populatedMetadata.filter(p => p.showInCard).length ? metadata : creationMetadata;
  }

  render() {
    // console.log('render item');
    const {onClick, active, buttons, templates, thesauris} = this.props;
    const doc = this.props.doc.toJS();
    const {title, icon, template, creationDate} = doc;

    const type = doc.type === 'entity' ? 'entity' : 'document';
    const className = this.props.className || '';

    const populatedMetadata = formater.prepareMetadata(doc, templates.toJS(), thesauris.toJS()).metadata;
    const metadata = this.formatMetadata(populatedMetadata, creationDate, template);

    return (
      <RowList.Item onClick={onClick || function () {}}
                    className={`item-${type} ${className}`}
                    active={active} >
        <div className="item-info">
          <Icon className="item-icon item-icon-center" data={icon} />
          <ItemName>{title}</ItemName>
        </div>
        <div className="item-metadata">
          {metadata}
        </div>
        <ItemFooter>
          <TemplateLabel template={template}/>
          {buttons}
        </ItemFooter>
      </RowList.Item>
    );
  }
}

Item.propTypes = {
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  onClick: PropTypes.func,
  active: PropTypes.bool,
  doc: PropTypes.object,
  buttons: PropTypes.array,
  className: PropTypes.string
};

const mapStateToProps = ({templates, thesauris}) => {
  return {templates, thesauris};
};

export default connect(mapStateToProps)(Item);
