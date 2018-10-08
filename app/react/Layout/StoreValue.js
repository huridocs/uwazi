import { connect } from 'react-redux';
import { getModel } from 'react-redux-form';

export const StoreValue = ({ value, children }) => children(value);

export const mapStateToProps = (state, { model }) => ({ value: getModel(state, model) });

export default connect(mapStateToProps)(StoreValue);
