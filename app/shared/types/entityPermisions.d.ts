export interface MemberWithPermission {
  type: 'user' | 'group';
  _id: string;
  label: string;
  level?: 'read' | 'write' | 'mixed';
}
