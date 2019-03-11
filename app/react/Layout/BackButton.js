import PropTypes from 'prop-types';
import React from 'react';

import { Icon } from 'UI';
import { I18NLink, t } from 'app/I18N';

const BackButton = ({ url }) => (
  <I18NLink to={url} className="btn btn-default">
    <Icon icon="arrow-left" directionAware />
    <span className="btn-label">{t('System', 'Back')}</span>
  </I18NLink>
);

BackButton.defaultProps = {
  url: '',
};

BackButton.propTypes = {
  url: PropTypes.string,
};

export default BackButton;
