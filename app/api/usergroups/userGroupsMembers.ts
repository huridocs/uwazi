import { ObjectIdSchema } from 'shared/types/commonTypes';
import { UserGroupSchema } from 'shared/types/userGroupType';
import userGroups from 'api/usergroups/userGroups';
import model from './userGroupsModel';

export const getByMemberIdList = async (userIds: ObjectIdSchema[]) =>
  model.get({ 'members.refId': { $in: userIds } });

export const updateUserMemberships = async (
  user: { _id: ObjectIdSchema },
  groups: { _id: ObjectIdSchema }[]
) => {
  const storedUserGroups = await getByMemberIdList([user._id.toString()]);
  const newGroupsIds = groups.map(group => group._id) || [];
  const groupsToUpdate: UserGroupSchema[] = [];

  storedUserGroups.forEach(storedGroup => {
    const keptGroup = newGroupsIds.find(groupId => groupId === storedGroup._id.toString());
    if (!keptGroup) {
      const groupToUpdate = { ...storedGroup };
      groupToUpdate.members = storedGroup.members.filter(
        m => m.refId.toString() !== user._id.toString()
      );
      groupsToUpdate.push(groupToUpdate);
    }
  });
  const missingGroupsIds = newGroupsIds.filter(
    groupId => !storedUserGroups.find(storedGroup => storedGroup._id.toString() === groupId)
  );
  const missingGroups = await userGroups.get({ _id: { $in: missingGroupsIds } });
  missingGroups.forEach(group => {
    group.members.push({ refId: user._id });
    groupsToUpdate.push(group);
  });
  await userGroups.saveMultiple(groupsToUpdate);
};

export const removeUsersFromAllGroups = async (_userIds: ObjectIdSchema[]) => {
  await model.updateMany({}, { $pull: { members: { refId: { $in: _userIds } } } });
};
