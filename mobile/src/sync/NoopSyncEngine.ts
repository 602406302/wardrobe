// 同步引擎空实现:本阶段所有方法返回空结果
// 未来接云端时,用 SupabaseSyncEngine 替换(见 sync/README.md)
import type { ISyncEngine } from '../domain/repositories/ISyncEngine';
import type { SyncResult, SyncStatus } from '../domain/types';

export class NoopSyncEngine implements ISyncEngine {
  status(): SyncStatus {
    return 'idle';
  }

  async push(): Promise<SyncResult> {
    return { synced: 0, conflicts: 0, status: 'idle' };
  }

  async pull(): Promise<SyncResult> {
    return { synced: 0, conflicts: 0, status: 'idle' };
  }

  async sync(): Promise<SyncResult> {
    return { synced: 0, conflicts: 0, status: 'idle' };
  }

  onStatusChange(_cb: (s: SyncStatus) => void): () => void {
    return () => {};
  }
}
