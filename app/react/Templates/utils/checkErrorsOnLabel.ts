import { IStore } from 'app/istore';
import { createSelector } from 'reselect';

const checkErrorsOnLabel: (state: IStore, props: any) => any = createSelector(
  (state: IStore, props: any) =>
    //@ts-ignore
    state.template.formState.$form.errors[`properties.${props.index}.label.required`],
  (state: IStore, props: any) =>
    //@ts-ignore
    state.template.formState.$form.errors[`properties.${props.index}.label.duplicated`],
  (required, duplicated) => required || duplicated
);

export { checkErrorsOnLabel };
