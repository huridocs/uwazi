//TODO: replace react redux form
import PropTypes from 'prop-types';
import { LocalForm as RRLF, Form as RRF } from 'react-redux-form';

const Form = RRF;
Form.propTypes = {
  children: PropTypes.node.isRequired,
};

const LocalForm = RRLF;
LocalForm.propTypes = {
  children: PropTypes.node.isRequired,
};
export { Form, LocalForm };
