export type TagType = 'category_l1' | 'category_l2' | 'color' | 'custom';

export interface Tag {
  id: string;
  type: TagType;
  name: string;
  parentId: string | null;       // 二级品类指向一级品类
  sortOrder: number;             // 用户可调顺序
  // 同步字段
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
  ownerId: string;
}

export interface TagInput {
  type: TagType;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
}
