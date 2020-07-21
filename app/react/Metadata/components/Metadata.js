/** @format */

import { I18NLink, t } from 'app/I18N';
import { Icon } from 'app/Layout';
import MarkdownViewer from 'app/Markdown';
import PropTypes from 'prop-types';
import React from 'react';
import GeolocationViewer from './GeolocationViewer';
import ValueList from './ValueList';

const showByType = (prop, compact) => {
  let result = prop.value;
  switch (prop.type) {
    case null:
      result = t('System', 'No property');
      break;
    case 'markdown':
      result = <MarkdownViewer markdown={prop.value} />;
      break;
    case 'link':
      result = (
        <a href={prop.value.url} target="_blank" rel="noopener noreferrer">
          {prop.value.label}
        </a>
      );
      break;
    case 'image':
      result = (
        <img
          key={prop.value}
          className={`multimedia-img ${prop.style}`}
          src={prop.value}
          alt={prop.label}
        />
      );
      break;
    case 'media':
      result = <MarkdownViewer markdown={`{media}(${prop.value})`} compact />;
      break;
    case 'geolocation':
      result = <GeolocationViewer points={prop.value} onlyForCards={Boolean(prop.onlyForCards)} />;
      break;
    default:
      if (prop.url) {
        result = (
          <I18NLink key={prop.url} to={prop.url}>
            {prop.icon && <Icon className="item-icon" data={prop.icon} />}
            {prop.value}
          </I18NLink>
        );
      }

      if (prop.value && prop.value.map) {
        prop.value = prop.value.map(_value => {
          const value = showByType(_value, compact);
          return value && value.value ? value : { value };
        });
        result = <ValueList compact={compact} property={prop} />;
      }
      break;
  }

  return result;
};

function filterProps(showSubset) {
  return p => {
    if (showSubset && !showSubset.includes(p.name)) {
      return false;
    }
    if (Array.isArray(p.value)) {
      return p.value.length;
    }
    return p.value || p.type === null;
  };
}

const Metadata = ({ metadata, compact, renderLabel, showSubset, highlight }) => (
  <React.Fragment>
    {metadata.filter(filterProps(showSubset)).map((prop, index) => {
      let type = prop.type ? prop.type : 'default';
      type = type === 'image' || type === 'media' ? 'multimedia' : type;
      const highlightClass = highlight.includes(prop.name) ? 'highlight' : '';
      const fullWidthClass = prop.fullWidth ? 'full-width' : '';
      return (
        <dl
          className={`metadata-type-${type} ${fullWidthClass} ${highlightClass}`}
          key={`${prop.name}_${index}`}
        >
          {renderLabel(prop, <dt>{t(prop.translateContext, prop.label)}</dt>)}
          <dd className={prop.sortedBy ? 'item-current-sort' : ''}>{showByType(prop, compact)}</dd>
        </dl>
      );
    })}
  </React.Fragment>
);

Metadata.defaultProps = {
  compact: false,
  showSubset: undefined,
  renderLabel: (_prop, label) => label,
  highlight: [],
};

Metadata.propTypes = {
  metadata: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.instanceOf(Object),
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(
          PropTypes.shape({
            value: PropTypes.string,
          })
        ),
      ]),
    })
  ).isRequired,
  highlight: PropTypes.arrayOf(PropTypes.string),
  compact: PropTypes.bool,
  renderLabel: PropTypes.func,
  showSubset: PropTypes.arrayOf(PropTypes.string),
};

export default Metadata;
