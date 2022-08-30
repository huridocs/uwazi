import { prepareClassValidator } from 'api2/types/ajv_validation';

const prepareClass = (_class: any) => {
  prepareClassValidator(_class);
};

export { prepareClass };
