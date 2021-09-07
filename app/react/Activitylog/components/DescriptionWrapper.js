import React from 'react';
import PropTypes from 'prop-types';
import { Map } from 'immutable';
import { Translate } from 'app/I18N';

const DescriptionWrapper = props => {
  const { entry, toggleExpand, expanded, children } = props;

  return (
    <div>
      <div>
        <span
          className="expand"
          onClick={() => {
            toggleExpand();
          }}
        >
          {children}
        </span>
      </div>
      {expanded && (
        <div className="expanded-content">
          <table>
            <tbody>
              {entry.getIn(['semantic', 'beautified']) && (
                <tr>
                  <td>
                    <Translate>Route</Translate>
                  </td>
                  <td>
                    {entry.get('method')} : {entry.get('url')}
                  </td>
                </tr>
              )}
              <tr>
                <td>
                  <Translate>Query</Translate>
                </td>
                <td className="tdquery">{entry.get('query')}</td>
              </tr>
              <tr>
                <td>
                  <Translate>Body</Translate>
                </td>
                <td className="tdbody">{entry.get('body')}</td>
              </tr>
              {entry.getIn(['semantic', 'errorStack']) && (
                <tr>
                  <td>
                    <Translate>Error</Translate>
                  </td>
                  <td className="tdbody">{entry.getIn(['semantic', 'errorStack'])}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

DescriptionWrapper.defaultProps = {
  children: <span />,
  expanded: false,
};

DescriptionWrapper.propTypes = {
  entry: PropTypes.instanceOf(Map).isRequired,
  toggleExpand: PropTypes.func.isRequired,
  expanded: PropTypes.bool,
  children: PropTypes.node,
};

export default DescriptionWrapper;
