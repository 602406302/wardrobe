import type { SyncResult, SyncStatus } from '../types';

export interface ISyncEngine {
  status(): SyncStatus;
  push(): Promise<SyncResult>;       // 本地→云端
  pull(): Promise<SyncResult>;       // 云端→本地
  sync(): Promise<SyncResult>;       // pull + push + 冲突解决
  onStatusChange(cb: (s: SyncStatus) => void): () => void;
}
