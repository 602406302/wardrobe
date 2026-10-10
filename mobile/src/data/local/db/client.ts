// SQLite 客户端:打开数据库、WAL 模式、建表、种子
import * as SQLite from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import { seedIfEmpty } from './seed';

const DB_NAME = 'wardrobe.db';

let _db: ExpoSQLiteDatabase<typeof schema> | null = null;
let _sqlite: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<ExpoSQLiteDatabase<typeof schema>> {
  if (_db) return _db;

  _sqlite = SQLite.openDatabaseSync(DB_NAME);
  await _sqlite.execAsync('PRAGMA journal_mode = WAL;');
  await _sqlite.execAsync('PRAGMA foreign_keys = ON;');

  _db = drizzle(_sqlite, { schema });

  // 建表 + 种子(首次启动)
  await runMigrations(_sqlite);
  await seedIfEmpty(_db);

  return _db;
}

// 返回底层 sqlite 客户端(需要跑原生 SQL 时用)
export function getSqlite(): SQLite.SQLiteDatabase {
  if (!_sqlite) throw new Error('DB 未初始化,先调用 getDb()');
  return _sqlite;
}

// 极简迁移:首次启动时直接建表
// 未来 schema 变更时,改用 drizzle-kit generate + 迁移表追踪
async function runMigrations(sqlite: SQLite.SQLiteDatabase): Promise<void> {
  await sqlite.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT,
      display_name TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER,
      version INTEGER DEFAULT 0,
      owner_id TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER,
      version INTEGER DEFAULT 0,
      owner_id TEXT
    );

    CREATE TABLE IF NOT EXISTS clothings (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      note TEXT,
      image_local_path TEXT NOT NULL,
      image_remote_url TEXT,
      image_thumb_path TEXT,
      width INTEGER,
      height INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER,
      version INTEGER DEFAULT 0,
      owner_id TEXT
    );

    CREATE TABLE IF NOT EXISTS clothing_tags (
      id TEXT PRIMARY KEY NOT NULL,
      clothing_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER,
      version INTEGER DEFAULT 0,
      owner_id TEXT
    );

    CREATE TABLE IF NOT EXISTS outfits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      note TEXT,
      cover_path TEXT,
      canvas_data TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      deleted_at INTEGER,
      version INTEGER DEFAULT 0,
      owner_id TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_cursors (
      table_name TEXT PRIMARY KEY NOT NULL,
      last_synced_at INTEGER,
      last_synced_version INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_clothing_tags_clothing ON clothing_tags(clothing_id);
    CREATE INDEX IF NOT EXISTS idx_clothing_tags_tag ON clothing_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_clothings_updated ON clothings(updated_at);
    CREATE INDEX IF NOT EXISTS idx_tags_updated ON tags(updated_at);
    CREATE INDEX IF NOT EXISTS idx_outfits_updated ON outfits(updated_at);
  `);
}

// 便捷:drizzle sql 标签的 re-export(Repository 实现里用)
export { sql };
