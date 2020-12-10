export interface MemberWithPermission {
  type: 'user' | 'group';
  _id: string;
  label: string;
  role?: 'contributor' | 'editor' | 'admin';
  level?: 'read' | 'write' | 'mixed';
}

export interface ValidationError {
  type: MemberWithPermission['type'];
  _id: MemberWithPermission['_id'];
}
