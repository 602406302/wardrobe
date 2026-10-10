// Drizzle SQLite schema
// 所有业务表都带同步字段,为未来云端同步预留
// 原则:uuid 主键、软删除、version 版本号、owner_id 所有者

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============ 用户(本阶段仅本地匿名)============
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),                  // 'local-user'
  email: text('email'),
  displayName: text('display_name'),
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 标签 ============
// 一级品类 / 二级品类 / 颜色 / 自定义标签 都存这张表,用 type 区分
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['category_l1', 'category_l2', 'color', 'custom'] }).notNull(),
  name: text('name').notNull(),
  parentId: text('parent_id'),                  // 二级品类指向一级;颜色/自定义为 null
  sortOrder: integer('sort_order').default(0),  // 用户可调顺序
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 衣物 ============
export const clothings = sqliteTable('clothings', {
  id: text('id').primaryKey(),
  name: text('name'),                           // 用户命名,可空
  note: text('note'),                           // 备注
  imageLocalPath: text('image_local_path').notNull(),     // 本地图片相对路径,如 originals/xxx.png
  imageRemoteUrl: text('image_remote_url'),     // 云端 URL,本阶段 null
  imageThumbPath: text('image_thumb_path'),     // 缩略图相对路径(瀑布流用)
  width: integer('width'),
  height: integer('height'),
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 衣物-标签 多对多 ============
export const clothingTags = sqliteTable('clothing_tags', {
  id: text('id').primaryKey(),
  clothingId: text('clothing_id').notNull(),
  tagId: text('tag_id').notNull(),
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 搭配方案 ============
export const outfits = sqliteTable('outfits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  note: text('note'),
  coverPath: text('cover_path'),                // 画布导出的封面图相对路径
  // 画布上每件衣物的摆放信息存 JSON(同步友好)
  canvasData: text('canvas_data'),              // JSON: [{clothingId, x, y, scale, rotation, zIndex}]
  // 同步字段
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
  deletedAt: integer('deleted_at'),
  version: integer('version').default(0),
  ownerId: text('owner_id'),
});

// ============ 同步游标(记录上次同步位置)============
// 本阶段建表,云端同步时用
export const syncCursors = sqliteTable('sync_cursors', {
  table: text('table_name').primaryKey(),       // 'clothings' / 'tags' / ...
  lastSyncedAt: integer('last_synced_at'),
  lastSyncedVersion: integer('last_synced_version'),
});
