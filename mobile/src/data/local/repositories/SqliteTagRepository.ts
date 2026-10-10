// 标签 Repository 的 SQLite 实现
import { eq, isNull, asc, sql, and, inArray } from 'drizzle-orm';
import type { ITagRepository } from '../../../domain/repositories/ITagRepository';
import type { Tag, TagInput, TagType } from '../../../domain/entities/Tag';
import { getDb } from '../db/client';
import * as schema from '../db/schema';
import { LOCAL_USER_ID } from '../db/seed';
import { syncFieldsForCreate, syncFieldsForUpdate, syncFieldsForSoftDelete } from './helpers';
import { v4 as uuid } from 'uuid';

export class SqliteTagRepository implements ITagRepository {
  async create(input: TagInput): Promise<Tag> {
    const db = await getDb();
    const id = uuid();
    await db.insert(schema.tags).values({
      id,
      type: input.type,
      name: input.name,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder ?? 0,
      ...syncFieldsForCreate(),
    });
    const rows = await db.select().from(schema.tags).where(eq(schema.tags.id, id)).limit(1);
    return toEntity(rows[0]!);
  }

  async update(id: string, patch: Partial<TagInput>): Promise<Tag> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Tag ${id} 不存在`);

    await db
      .update(schema.tags)
      .set({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.type !== undefined && { type: patch.type }),
        ...(patch.parentId !== undefined && { parentId: patch.parentId }),
        ...(patch.sortOrder !== undefined && { sortOrder: patch.sortOrder }),
        ...syncFieldsForUpdate(existing.version),
      })
      .where(eq(schema.tags.id, id));

    return this.getById(id) as Promise<Tag>;
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return;
    await db
      .update(schema.tags)
      .set(syncFieldsForSoftDelete(existing.version))
      .where(eq(schema.tags.id, id));
  }

  async reorder(ids: string[]): Promise<void> {
    const db = await getDb();
    // 逐条更新 sortOrder,简单稳妥
    for (let i = 0; i < ids.length; i++) {
      const existing = await this.getById(ids[i]);
      if (!existing) continue;
      await db
        .update(schema.tags)
        .set({
          sortOrder: i,
          ...syncFieldsForUpdate(existing.version),
        })
        .where(eq(schema.tags.id, ids[i]));
    }
  }

  async list(type?: TagType): Promise<Tag[]> {
    const db = await getDb();
    const conditions = [isNull(schema.tags.deletedAt)];
    if (type) conditions.push(eq(schema.tags.type, type));

    const rows = await db
      .select()
      .from(schema.tags)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(asc(schema.tags.sortOrder), asc(schema.tags.name));
    return rows.map(toEntity);
  }

  async listChangedSince(since: number): Promise<Tag[]> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.tags)
      .where(
        and(
          eq(schema.tags.ownerId, LOCAL_USER_ID),
          sql`${schema.tags.updatedAt} > ${since}`
        )
      );
    return rows.map(toEntity);
  }

  private async getById(id: string): Promise<Tag | null> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.tags)
      .where(and(eq(schema.tags.id, id), isNull(schema.tags.deletedAt)))
      .limit(1);
    return rows[0] ? toEntity(rows[0]) : null;
  }
}

function toEntity(row: typeof schema.tags.$inferSelect): Tag {
  return {
    id: row.id,
    type: row.type as TagType,
    name: row.name,
    parentId: row.parentId,
    sortOrder: row.sortOrder ?? 0,
    createdAt: row.createdAt ?? 0,
    updatedAt: row.updatedAt ?? 0,
    deletedAt: row.deletedAt,
    version: row.version ?? 0,
    ownerId: row.ownerId ?? LOCAL_USER_ID,
  };
}
