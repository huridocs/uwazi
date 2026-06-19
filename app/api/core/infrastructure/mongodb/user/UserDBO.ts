import { ObjectId } from 'mongodb';

interface UserDBO {
  _id: ObjectId;
  username: string;
  role: string;
  email: string;
  password?: string | null;
  using2fa?: boolean;
  secret?: string | null;
}

export type { UserDBO };
