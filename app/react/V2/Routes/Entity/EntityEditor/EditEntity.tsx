import { Entity } from '#V2/api/entities/types.js';

const EditEntity = ({ entity }: { entity?: Entity }) => {
  return entity?._id;
};

export { EditEntity };
