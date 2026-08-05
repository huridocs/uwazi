import { ObjectId } from 'mongodb';

interface UserGroupDBO {
  _id: ObjectId;
  name: string;
  members: { refId: string }[];
}

export type { UserGroupDBO };
