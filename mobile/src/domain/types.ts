// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// 同步结果
export interface SyncResult {
  synced: number;
  conflicts: number;
  status: SyncStatus;
  error?: string;
}

// 同步冲突
export interface SyncConflict<T = unknown> {
  table: string;
  id: string;
  local: T;
  remote: T;
}

// 同步记录(传输包)
export interface SyncRecord<T = unknown> {
  table: 'clothings' | 'tags' | 'outfits' | 'clothing_tags';
  op: 'upsert' | 'delete';
  data: T;
}

// 排序
export type SortOrder = 'asc' | 'desc';
