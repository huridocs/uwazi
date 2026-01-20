import Ajv from 'ajv';
import ajvKeywords from 'ajv-keywords';
import { wrapValidator } from '#shared/tsUtils.js';

import { UserGroupSchema } from '#shared/types/userGroupType.js';
import { userGroupSchema } from '#shared/types/userGroupSchema.js';
import model from '#api/usergroups/userGroupsModel.js';

const ajv = ajvKeywords(new Ajv({ allErrors: true }), ['uniqueItemProperties']);
ajv.addVocabulary(['tsType']);

ajv.addKeyword({
  keyword: 'uniqueName',
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
