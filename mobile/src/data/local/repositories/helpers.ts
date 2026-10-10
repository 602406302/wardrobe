// 同步字段辅助:统一生成时间戳、版本号、owner
import { LOCAL_USER_ID } from '../db/seed';

export function now(): number {
  return Date.now();
}

// 新建记录的同步字段
export function syncFieldsForCreate() {
  const t = now();
  return {
    createdAt: t,
    updatedAt: t,
    deletedAt: null,
    version: 0,
    ownerId: LOCAL_USER_ID,
  };
}

// 更新记录的同步字段(version +1)
export function syncFieldsForUpdate(prevVersion: number) {
  return {
    updatedAt: now(),
    version: prevVersion + 1,
  };
}

// 软删除的同步字段(version +1,deletedAt 置当前时间)
export function syncFieldsForSoftDelete(prevVersion: number) {
  return {
    updatedAt: now(),
    deletedAt: now(),
    version: prevVersion + 1,
  };
}
