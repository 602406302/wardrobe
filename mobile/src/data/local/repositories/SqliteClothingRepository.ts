// 衣物 Repository 的 SQLite 实现
import { eq, isNull, desc, asc, sql, and, inArray } from 'drizzle-orm';
import type { IClothingRepository } from '../../../domain/repositories/IClothingRepository';
import type { Clothing, ClothingInput, ClothingFilter } from '../../../domain/entities/Clothing';
import { getDb, getSqlite } from '../db/client';
import * as schema from '../db/schema';
import { LOCAL_USER_ID } from '../db/seed';
import { syncFieldsForCreate, syncFieldsForUpdate, syncFieldsForSoftDelete } from './helpers';
import { v4 as uuid } from 'uuid';

export class SqliteClothingRepository implements IClothingRepository {
  async create(input: ClothingInput): Promise<Clothing> {
    const db = await getDb();
    const id = uuid();
    const record = {
      id,
      name: input.name ?? null,
      note: input.note ?? null,
      imageLocalPath: input.imageLocalPath,
      imageRemoteUrl: null,
      imageThumbPath: input.imageThumbPath ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      ...syncFieldsForCreate(),
    };
    await db.insert(schema.clothings).values(record);
    return (await this.getById(id))!;
  }

  async update(id: string, patch: Partial<ClothingInput>): Promise<Clothing> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Clothing ${id} 不存在`);

    await db
      .update(schema.clothings)
      .set({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.note !== undefined && { note: patch.note }),
        ...(patch.imageLocalPath !== undefined && { imageLocalPath: patch.imageLocalPath }),
        ...(patch.imageThumbPath !== undefined && { imageThumbPath: patch.imageThumbPath }),
        ...(patch.width !== undefined && { width: patch.width }),
        ...(patch.height !== undefined && { height: patch.height }),
        ...syncFieldsForUpdate(existing.version),
      })
      .where(eq(schema.clothings.id, id));

    return (await this.getById(id))!;
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return;

    await db
      .update(schema.clothings)
      .set(syncFieldsForSoftDelete(existing.version))
      .where(eq(schema.clothings.id, id));
  }

  async getById(id: string): Promise<Clothing | null> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.clothings)
      .where(and(eq(schema.clothings.id, id), isNull(schema.clothings.deletedAt)))
      .limit(1);
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async list(filter: ClothingFilter = {}): Promise<Clothing[]> {
    const db = await getDb();

    // 标签筛选:先查出匹配的 clothingId 集合
    let allowedIds: string[] | null = null;
    if (filter.tagIds && filter.tagIds.length > 0) {
      const matched = await db
        .select({ id: schema.clothingTags.clothingId })
        .from(schema.clothingTags)
        .where(
          and(
            inArray(schema.clothingTags.tagId, filter.tagIds),
            isNull(schema.clothingTags.deletedAt)
          )
        );
      allowedIds = matched.map((r) => r.id).filter((x): x is string => x !== null);
      if (allowedIds.length === 0) return [];
    }

    // 用原生 SQL WHERE 拼接,避开 drizzle 链式类型推断问题
    const conditions: string[] = ['deleted_at IS NULL'];
    const params: unknown[] = [];
    if (filter.keyword) {
      conditions.push('(name LIKE ? OR note LIKE ?)');
      const kw = `%${filter.keyword}%`;
      params.push(kw, kw);
    }
    if (allowedIds) {
      const placeholders = allowedIds.map(() => '?').join(',');
      conditions.push(`id IN (${placeholders})`);
      params.push(...allowedIds);
    }

    const sortCol = filter.sortBy === 'updatedAt' ? 'updated_at' : 'created_at';
    const sortDir = filter.sortOrder === 'asc' ? 'ASC' : 'DESC';
    let query = `SELECT * FROM clothings WHERE ${conditions.join(' AND ')} ORDER BY ${sortCol} ${sortDir}`;
    if (filter.limit) {
      query += ` LIMIT ?`;
      params.push(filter.limit);
      if (filter.offset) {
        query += ` OFFSET ?`;
        params.push(filter.offset);
      }
    }

    const sqlite = getSqlite();
    const rows = await sqlite.getAllAsync(query, params as any);
    return (rows as Record<string, unknown>[]).map(rowToEntity);
  }

  async listByIds(ids: string[]): Promise<Clothing[]> {
    if (ids.length === 0) return [];
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.clothings)
      .where(and(inArray(schema.clothings.id, ids), isNull(schema.clothings.deletedAt)));
    return rows.map(toEntity);
  }

  async listChangedSince(since: number): Promise<Clothing[]> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.clothings)
      .where(
        and(
          eq(schema.clothings.ownerId, LOCAL_USER_ID),
          sql`${schema.clothings.updatedAt} > ${since}`
        )
      );
    return rows.map(toEntity);
  }

  // 标签关联:覆盖式设置(先软删旧的,再插入新的)
  async setTags(clothingId: string, tagIds: string[]): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    // 软删现有关联
    await db
      .update(schema.clothingTags)
      .set({ deletedAt: now, updatedAt: now, version: sql`${schema.clothingTags.version} + 1` })
      .where(
        and(
          eq(schema.clothingTags.clothingId, clothingId),
          isNull(schema.clothingTags.deletedAt)
        )
      );
    // 插入新关联
    for (const tagId of tagIds) {
      await db.insert(schema.clothingTags).values({
        id: uuid(),
        clothingId,
        tagId,
        ...syncFieldsForCreate(),
      });
    }
  }

  async getTagIds(clothingId: string): Promise<string[]> {
    const db = await getDb();
    const rows = await db
      .select({ tagId: schema.clothingTags.tagId })
      .from(schema.clothingTags)
      .where(
        and(
          eq(schema.clothingTags.clothingId, clothingId),
          isNull(schema.clothingTags.deletedAt)
        )
      );
    return rows.map((r) => r.tagId).filter((x): x is string => x !== null);
  }
}

// DB 行(drizzle camelCase)→ 实体
function toEntity(row: typeof schema.clothings.$inferSelect): Clothing {
  return {
    id: row.id,
    name: row.name,
    note: row.note,
    imageLocalPath: row.imageLocalPath,
    imageRemoteUrl: row.imageRemoteUrl,
    imageThumbPath: row.imageThumbPath,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt ?? 0,
    updatedAt: row.updatedAt ?? 0,
    deletedAt: row.deletedAt,
    version: row.version ?? 0,
    ownerId: row.ownerId ?? LOCAL_USER_ID,
  };
}

// 原生 SQL 行(snake_case)→ 实体
function rowToEntity(row: Record<string, unknown>): Clothing {
  return {
    id: row.id as string,
    name: (row.name as string | null) ?? null,
    note: (row.note as string | null) ?? null,
    imageLocalPath: (row.image_local_path as string) ?? '',
    imageRemoteUrl: (row.image_remote_url as string | null) ?? null,
    imageThumbPath: (row.image_thumb_path as string | null) ?? null,
    width: (row.width as number | null) ?? null,
    height: (row.height as number | null) ?? null,
    createdAt: (row.created_at as number) ?? 0,
    updatedAt: (row.updated_at as number) ?? 0,
    deletedAt: (row.deleted_at as number | null) ?? null,
    version: (row.version as number) ?? 0,
    ownerId: (row.owner_id as string) ?? LOCAL_USER_ID,
  };
}
