export interface MemberWithPermission {
  type: 'user' | 'group';
  id: string;
  label: string;
  role?: 'contributor' | 'editor' | 'admin';
  level?: 'read' | 'write' | 'mixed';
}
