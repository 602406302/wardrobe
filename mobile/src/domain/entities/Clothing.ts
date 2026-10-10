import type { SortOrder } from '../types';

export interface Clothing {
  id: string;
  name: string | null;
  note: string | null;
  imageLocalPath: string;        // 相对路径,如 originals/xxx.png
  imageRemoteUrl: string | null; // 云端 URL,本阶段 null
  imageThumbPath: string | null; // 缩略图相对路径
  width: number | null;
  height: number | null;
  // 同步字段
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
  ownerId: string;
}

export interface ClothingInput {
  name?: string | null;
  note?: string | null;
  imageLocalPath: string;
  imageThumbPath?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ClothingFilter {
  tagIds?: string[];             // 标签组合筛选
  keyword?: string;              // 匹配 name + note + 标签名
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: SortOrder;
  limit?: number;
  offset?: number;
}
