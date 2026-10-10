export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  // 同步字段
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
  ownerId: string;
}
