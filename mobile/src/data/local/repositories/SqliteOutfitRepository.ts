// 搭配 Repository 的 SQLite 实现
import { eq, isNull, desc, sql, and } from 'drizzle-orm';
import type { IOutfitRepository } from '../../../domain/repositories/IOutfitRepository';
import type { Outfit, OutfitInput, OutfitItemPlacement } from '../../../domain/entities/Outfit';
import { getDb } from '../db/client';
import * as schema from '../db/schema';
import { LOCAL_USER_ID } from '../db/seed';
import { syncFieldsForCreate, syncFieldsForUpdate, syncFieldsForSoftDelete } from './helpers';
import { v4 as uuid } from 'uuid';

export class SqliteOutfitRepository implements IOutfitRepository {
  async create(input: OutfitInput): Promise<Outfit> {
    const db = await getDb();
    const id = uuid();
    await db.insert(schema.outfits).values({
      id,
      name: input.name,
      note: input.note ?? null,
      coverPath: input.coverPath ?? null,
      canvasData: JSON.stringify(input.canvasData),
      ...syncFieldsForCreate(),
    });
    return this.getById(id) as Promise<Outfit>;
  }

  async update(id: string, patch: Partial<OutfitInput>): Promise<Outfit> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Outfit ${id} 不存在`);

    await db
      .update(schema.outfits)
      .set({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.note !== undefined && { note: patch.note }),
        ...(patch.coverPath !== undefined && { coverPath: patch.coverPath }),
        ...(patch.canvasData !== undefined && { canvasData: JSON.stringify(patch.canvasData) }),
        ...syncFieldsForUpdate(existing.version),
      })
      .where(eq(schema.outfits.id, id));

    return this.getById(id) as Promise<Outfit>;
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDb();
    const existing = await this.getById(id);
    if (!existing) return;
    await db
      .update(schema.outfits)
      .set(syncFieldsForSoftDelete(existing.version))
      .where(eq(schema.outfits.id, id));
  }

  async getById(id: string): Promise<Outfit | null> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.outfits)
      .where(and(eq(schema.outfits.id, id), isNull(schema.outfits.deletedAt)))
      .limit(1);
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async list(): Promise<Outfit[]> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.outfits)
      .where(isNull(schema.outfits.deletedAt))
      .orderBy(desc(schema.outfits.updatedAt));
    return rows.map(toEntity);
  }

  async listChangedSince(since: number): Promise<Outfit[]> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.outfits)
      .where(
        and(
          eq(schema.outfits.ownerId, LOCAL_USER_ID),
          sql`${schema.outfits.updatedAt} > ${since}`
        )
      );
    return rows.map(toEntity);
  }
}

function toEntity(row: typeof schema.outfits.$inferSelect): Outfit {
  let canvasData: OutfitItemPlacement[] = [];
  try {
    canvasData = row.canvasData ? JSON.parse(row.canvasData) : [];
  } catch {
    canvasData = [];
  }
  return {
    id: row.id,
    name: row.name,
    note: row.note,
    coverPath: row.coverPath,
    canvasData,
    createdAt: row.createdAt ?? 0,
    updatedAt: row.updatedAt ?? 0,
    deletedAt: row.deletedAt,
    version: row.version ?? 0,
    ownerId: row.ownerId ?? LOCAL_USER_ID,
  };
}
