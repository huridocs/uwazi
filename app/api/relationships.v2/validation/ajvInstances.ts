import Ajv from 'ajv';

const defaultAjv = new Ajv({ allErrors: true });

export { defaultAjv };
