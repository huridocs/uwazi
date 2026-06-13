import { User } from '#api/users.v2/model/User.js';

export const buildPermissionMatch = (actor: User, includeUnpublished?: boolean): object => {
  if (actor.isPrivileged() && includeUnpublished) {
    return {};
  }

  if (actor.isPrivileged()) {
    return {};
  }

  const userRefIds = [actor._id, ...actor.groups];

  return {
    $or: [{ published: true }, { permissions: { $elemMatch: { refId: { $in: userRefIds } } } }],
  };
};
