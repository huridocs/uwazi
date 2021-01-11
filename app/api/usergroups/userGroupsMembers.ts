import { ObjectIdSchema } from 'shared/types/commonTypes';
import { GroupMemberSchema, UserGroupSchema } from 'shared/types/userGroupType';
import userGroups from 'api/usergroups/userGroups';
import model from './userGroupsModel';

export const getByMemberIdList = (userIds: ObjectIdSchema[]) =>
  model.get({ 'members._id': { $in: userIds } });

export const updateUserMemberships = async (
  user: GroupMemberSchema,
  groups: { _id: ObjectIdSchema }[]
) => {
  const currentGroups = await getByMemberIdList([user._id.toString()]);
  const groupsOfUser = groups.map(group => group._id);
  const actualGroupsIds = groupsOfUser || [];
  const groupsToUpdate: UserGroupSchema[] = [];

  currentGroups.forEach(currentGroup => {
    const actualGroup = actualGroupsIds.find(groupId => groupId === currentGroup._id.toString());
    if (!actualGroup) {
      const groupToUpdate = { ...currentGroup };
      groupToUpdate.members = currentGroup.members.filter(
        m => m._id.toString() !== user._id.toString()
      );
      groupsToUpdate.push(groupToUpdate);
    }
  });
  const missingGroupsIds = actualGroupsIds.filter(
    groupId => !currentGroups.find(currentGroup => currentGroup._id.toString() === groupId)
  );
  const missingGroups = await userGroups.get({ _id: { $in: missingGroupsIds } });
  missingGroups.forEach(group => {
    group.members.push(user);
    groupsToUpdate.push(group);
  });
  await userGroups.saveMultiple(groupsToUpdate);
};
