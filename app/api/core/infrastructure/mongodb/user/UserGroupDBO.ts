import { ObjectId } from 'mongodb';

interface UserGroupDBO {
  _id: ObjectId;
  name: string;
  members: { refId: ObjectId }[];
}

export type { UserGroupDBO };
