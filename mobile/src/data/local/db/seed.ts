// 种子数据:首次启动写入预设标签 + local-user
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { v4 as uuid } from 'uuid';
import * as schema from './schema';

const LOCAL_USER_ID = 'local-user';

// 预设一级品类
const CATEGORY_L1 = ['上装', '下装', '配饰', '鞋子', '连体衣'];

// 预设二级品类(key 对应一级品类名)
const CATEGORY_L2: Record<string, string[]> = {
  上装: ['长袖T', '短袖T', '衬衫长袖', '衬衫短袖', '卫衣', '毛衣', '外套', '西装'],
  下装: ['长裤', '短裤', '半裙', '运动裤', '牛仔裤'],
  鞋子: ['运动鞋', '皮鞋', '靴子', '凉鞋', '拖鞋'],
  配饰: ['帽子', '围巾', '领带', '腰带', '包', '首饰'],
  连体衣: ['连衣裙', '连体裤'],
};

// 预设颜色
const COLORS = ['黑', '白', '灰', '米', '红', '橙', '黄', '绿', '蓝', '紫', '粉', '棕', '花色'];

export async function seedIfEmpty(db: ExpoSQLiteDatabase<typeof schema>): Promise<void> {
  const existing = await db.select().from(schema.users).limit(1);
  if (existing.length > 0) return; // 已有数据,跳过

  const now = Date.now();
  const ownerId = LOCAL_USER_ID;

  // 1. local-user
  await db.insert(schema.users).values({
    id: LOCAL_USER_ID,
    email: null,
    displayName: '本地用户',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 0,
    ownerId,
  });

  // 2. 一级品类 + 二级品类
  let sort = 0;
  for (const l1Name of CATEGORY_L1) {
    const l1Id = uuid();
    await db.insert(schema.tags).values({
      id: l1Id,
      type: 'category_l1',
      name: l1Name,
      parentId: null,
      sortOrder: sort++,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 0,
      ownerId,
    });
    for (const l2Name of CATEGORY_L2[l1Name] ?? []) {
      await db.insert(schema.tags).values({
        id: uuid(),
        type: 'category_l2',
        name: l2Name,
        parentId: l1Id,
        sortOrder: sort++,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        version: 0,
        ownerId,
      });
    }
  }

  // 3. 颜色
  let colorSort = 0;
  for (const color of COLORS) {
    await db.insert(schema.tags).values({
      id: uuid(),
      type: 'color',
      name: color,
      parentId: null,
      sortOrder: colorSort++,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 0,
      ownerId,
    });
  }
}

export { LOCAL_USER_ID };
