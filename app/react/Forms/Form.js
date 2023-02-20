/* eslint-disable max-classes-per-file */
//TODO: replace react redux form
import PropTypes from 'prop-types';
import { LocalForm as RRLF, Form as RRF } from 'react-redux-form';

class Form extends RRF {}

Form.propTypes = {
  children: PropTypes.node.isRequired,
};

class LocalForm extends RRLF {}

LocalForm.propTypes = {
  children: PropTypes.node.isRequired,
};
export { Form, LocalForm };
