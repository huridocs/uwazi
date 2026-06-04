import { useLoaderData } from 'react-router';
import type { LoaderResponse } from './types.js';

const EditEntity = () => {
  const { entity, error } = (useLoaderData() as LoaderResponse) || {};
  console.log(entity);

  if (error) {
    return 'error loading';
  }

  return entity?._id;
};

export { EditEntity };
