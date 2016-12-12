import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {formater} from 'app/Metadata';
import {is} from 'immutable';
import marked from 'marked';

import t from '../I18N/t';
import ShowIf from 'app/App/ShowIf';

import {RowList, ItemFooter} from './Lists';
import Icon from './Icon';
import TemplateLabel from './TemplateLabel';
import PrintDate from './PrintDate';

export class Item extends Component {

  formatMetadata(populatedMetadata, creationDate, translationContext) {
    const metadata = populatedMetadata
    .filter(p => p.showInCard && (p.value && p.value.length > 0 || p.markdown))
    .map((property, index) => {
      let value = typeof property.value !== 'object' ? property.value : property.value.map(d => d.value).join(', ');
      if (property.markdown) {
        value = <div className="markdownViewer" dangerouslySetInnerHTML={{__html: marked(property.markdown, {sanitize: true})}}/>;
      }
      return (
        <dl key={index}>
          <dt>{t(property.context || translationContext, property.label)}</dt>
          <dd><Icon className="item-icon item-icon-center" data={property.icon} />{value}</dd>
        </dl>
      );
    });

    const creationMetadata = <dl><dt>Upload date</dt><dd><PrintDate utc={creationDate} toLocal={true} /></dd></dl>;

    return metadata.length || populatedMetadata.filter(p => p.showInCard).length ? metadata : creationMetadata;
  }

  getMetadata(doc) {
    doc.metadata = doc.metadata || {};
    const populatedMetadata = formater.prepareMetadata(doc, this.props.templates.toJS(), this.props.thesauris.toJS()).metadata;

    if (this.props.additionalMetadata && this.props.additionalMetadata.length) {
      this.props.additionalMetadata.reverse().forEach(metadata => {
        const {label, value} = metadata;
        populatedMetadata.unshift({value, label, icon: metadata.icon, showInCard: true, context: 'System'});
      });
    }

    return this.formatMetadata(populatedMetadata, doc.creationDate, doc.template);
  }

  shouldComponentUpdate(nextProps) {
    return !is(this.props.doc, nextProps.doc) ||
           this.props.active !== nextProps.active ||
           this.props.className !== nextProps.className;
  }

  render() {
    const {onClick, onMouseEnter, onMouseLeave, active, additionalIcon, additionalText,
           templateClassName, buttons, evalPublished} = this.props;

    const doc = this.props.doc.toJS();
    const snippet = additionalText ? <div className="item-snippet">{additionalText}</div> : '';
    const metadata = this.getMetadata(doc);

    return (
      <RowList.Item
        className={`item-${doc.type === 'entity' ? 'entity' : 'document'} ${this.props.className || ''}`}
        onClick={onClick || function () {}}
        onMouseEnter={onMouseEnter || function () {}}
        onMouseLeave={onMouseLeave || function () {}}
        active={active}>
        <div className="item-info">
          <div className="item-name">
            <ShowIf if={evalPublished && !doc.published}>
              <i className="item-private-icon fa fa-lock"></i>
            </ShowIf>
            {additionalIcon || ''}
            <Icon className="item-icon item-icon-center" data={doc.icon} />
            <span>{doc.title}</span>
            {snippet}
          </div>
        </div>
        <div className="item-metadata">
          {metadata}
        </div>
        <ItemFooter>
          <div className={`item-label-group ${templateClassName || ''}`}>
            <TemplateLabel template={doc.template}/>
          </div>
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
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  active: PropTypes.bool,
  additionalIcon: PropTypes.object,
  additionalText: PropTypes.string,
  additionalMetadata: PropTypes.array,
  doc: PropTypes.object,
  buttons: PropTypes.object,
  className: PropTypes.string,
  templateClassName: PropTypes.string,
  evalPublished: PropTypes.bool
};

const mapStateToProps = ({templates, thesauris}) => {
  return {templates, thesauris};
};

export default connect(mapStateToProps)(Item);
