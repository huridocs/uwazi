import { connect } from 'react-redux';
import { getModel } from 'react-redux-form';

export const FormValue = ({ value, children }) => children(value);

export const mapStateToProps = (state, { model }) => ({ value: getModel(state, model) });

const FormValueConnected = connect(mapStateToProps)(FormValue);
export { FormValueConnected };
