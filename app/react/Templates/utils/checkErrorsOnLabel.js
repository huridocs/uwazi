import { createSelector } from 'reselect';

const checkErrorsOnLabel = createSelector(
  (state, props) =>
    state.template.formState.$form.errors[`properties.${props.index}.label.required`],
  (state, props) =>
    state.template.formState.$form.errors[`properties.${props.index}.label.duplicated`],
  (required, duplicated) => required || duplicated
);

export { checkErrorsOnLabel };
