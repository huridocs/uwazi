// TEST!!!
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {formater} from 'app/Metadata';
import {is, fromJS as Immutable} from 'immutable';
import marked from 'marked';
import t from '../I18N/t';

import {RowList, ItemFooter} from './Lists';
import Icon from './Icon';
import TemplateLabel from './TemplateLabel';
import PrintDate from './PrintDate';

import DocumentsAPI from 'app/Documents/DocumentsAPI';
import EntitiesAPI from 'app/Entities/EntitiesAPI';

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

    const creationMetadata = <dl><dt><i>Upload date</i></dt><dd><PrintDate utc={creationDate} toLocal={true} /></dd></dl>;

    return metadata.length || populatedMetadata.filter(p => p.showInCard).length ? metadata : creationMetadata;
  }

  getMetadata(doc) {
    if (this.props.doc.get('metadata')) {
      this.setState({metadata: doc.get('metadata')});
      return;
    }

    const get = doc.type === 'document' ? DocumentsAPI.get : EntitiesAPI.get;
    get(doc.get('sharedId'))
    .then(docsData => {
      this.setState({metadata: Immutable(docsData[0].metadata || {})});
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!is(this.props.doc, nextProps.doc) || !this.state.metadata) {
      this.getMetadata(this.props.doc);
    }
  }

  componentDidMount() {
    if (!this.state.metadata) {
      this.getMetadata(this.props.doc);
    }
  }

  componentWillMount() {
    if (this.props.doc.get('metadata')) {
      this.setState({metadata: this.props.doc.get('metadata')});
      return;
    }

    this.setState({metadata: null});
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !is(this.props.doc, nextProps.doc) ||
           !is(this.state.metadata, nextState.metadata) ||
           this.props.active !== nextProps.active ||
           this.props.className !== nextProps.className;
  }

  render() {
    const {onClick, onMouseEnter, onMouseLeave, active, additionalIcon, additionalText, additionalMetadata,
           templateClassName, buttons, templates, thesauris} = this.props;

    const doc = this.props.doc.toJS();
    const {title, icon, template, creationDate} = doc;

    const type = doc.type === 'entity' ? 'entity' : 'document';
    const className = this.props.className || '';

    const snippet = additionalText ? <div className="item-snippet">{additionalText}</div> : '';

    doc.metadata = this.state.metadata ? this.state.metadata.toJS() : {};

    const populatedMetadata = formater.prepareMetadata(doc, templates.toJS(), thesauris.toJS()).metadata;

    if (additionalMetadata && additionalMetadata.length) {
      additionalMetadata.reverse().forEach(metadata => {
        const {label, value} = metadata;
        populatedMetadata.unshift({value, label, icon: metadata.icon, showInCard: true, context: 'System'});
      });
    }

    const metadata = this.formatMetadata(populatedMetadata, creationDate, template);


    return (
      <RowList.Item
        className={`item-${type} ${className}`}
        onClick={onClick || function () {}}
        onMouseEnter={onMouseEnter || function () {}}
        onMouseLeave={onMouseLeave || function () {}}
        active={active} >
        <div className="item-info">
          <div className="item-name">
            {additionalIcon || ''}
            <Icon className="item-icon item-icon-center" data={icon} />
            <span>{title}</span>
            {snippet}
          </div>
        </div>
        <div className="item-metadata">
          {metadata}
        </div>
        <ItemFooter>
          <div className={templateClassName || ''}>
            <TemplateLabel template={template}/>
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
  templateClassName: PropTypes.string
};

const mapStateToProps = ({templates, thesauris}) => {
  return {templates, thesauris};
};

export default connect(mapStateToProps)(Item);
