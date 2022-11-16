import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';

const PayPalDonateLink = ({ paypalid, classname, children, currency, amount }) => {
  const amountParam = amount ? `&amount=${amount}` : '';
  const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${paypalid}&currency_code=${currency}${amountParam}&source=url`;
  classname += ' paypal-donate';
  return (
    <Link className={classname} href={url} target="_blank" rel="noreferrer noopener">
      {children}
    </Link>
  );
};

PayPalDonateLink.defaultProps = {
  children: '',
  classname: '',
  amount: null,
};

PayPalDonateLink.propTypes = {
  paypalid: PropTypes.string.isRequired,
  currency: PropTypes.string.isRequired,
  classname: PropTypes.string,
  amount: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
};

export default PayPalDonateLink;
