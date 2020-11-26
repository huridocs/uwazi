import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import { wrapValidator } from 'shared/tsUtils';

import { UserGroupSchema } from 'shared/types/userGroupType';
import { userGroupSchema } from 'shared/types/userGroupSchema';
import model from './userGroupsModel';

const ajv = ajvKeywords(Ajv({ allErrors: true }), ['uniqueItemProperties']);

ajv.addKeyword('uniqueName', {
  async: true,
  validate: async (_config: any, userGroup: UserGroupSchema) => {
    const [duplicated] = await model.get({
      _id: { $ne: userGroup._id },
      name: new RegExp(`^${userGroup.name}$` || '', 'i'),
    });

    return duplicated === undefined;
  },
});

export const validateUserGroup = wrapValidator(ajv.compile(userGroupSchema));
