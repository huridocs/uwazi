export interface MemberWithPermission {
  type: 'user' | 'group';
  _id: string;
  label: string;
  role?: 'collaborator' | 'editor' | 'admin';
  level?: 'read' | 'write' | 'mixed';
}
