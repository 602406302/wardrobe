// 本地匿名账号:本阶段固定返回 local-user
// 未来接云端时,用 SupabaseAuth 替换
import type { IAuth } from '../../../domain/repositories/IAuth';
import type { User } from '../../../domain/entities/User';
import { getDb } from '../db/client';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { LOCAL_USER_ID } from '../db/seed';

export class LocalAnonymousAuth implements IAuth {
  async currentUser(): Promise<User> {
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, LOCAL_USER_ID))
      .limit(1);
    const row = rows[0];
    if (!row) {
      // 理论上种子已写入,兜底返回内存对象
      return {
        id: LOCAL_USER_ID,
        email: null,
        displayName: '本地用户',
        createdAt: 0,
        updatedAt: 0,
        deletedAt: null,
        version: 0,
        ownerId: LOCAL_USER_ID,
      };
    }
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      createdAt: row.createdAt ?? 0,
      updatedAt: row.updatedAt ?? 0,
      deletedAt: row.deletedAt,
      version: row.version ?? 0,
      ownerId: row.ownerId ?? LOCAL_USER_ID,
    };
  }

  async signInAnonymously(): Promise<User> {
    return this.currentUser();
  }

  // 云端登录预留:本阶段抛错
  async signIn(_email: string, _password: string): Promise<User> {
    throw new Error('云端登录未开放,见 DEVELOPMENT.md §7');
  }

  async signOut(): Promise<void> {
    // 本地匿名账号无登出概念
  }

  onAuthChange(cb: (u: User | null) => void): () => void {
    // 立即返回当前用户,之后无变化
    this.currentUser().then(cb).catch(() => cb(null));
    return () => {}; // 无订阅清理
  }
}
