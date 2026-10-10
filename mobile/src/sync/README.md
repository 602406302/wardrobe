// 同步引擎设计说明
// ==================
// 本阶段:NoopSyncEngine 空实现,所有方法返回 { synced: 0 }
// 未来:实现 SupabaseSyncEngine,在此文件同目录新增
//
// 同步策略:本地优先 + 双向增量同步
//
// 核心原则:
// 1. 本地优先:所有读写先落本地,即时返回,不阻塞 UI
// 2. 后台同步:异步进行,失败重试,不丢数据
// 3. 增量同步:用 updated_at + version 游标,只同步变更
// 4. 软删除传播:删除只置 deleted_at,同步时传播
//
// 同步流程:
// sync() = pull() → push() → resolveConflicts()
//
// pull():
//   for each table:
//     cursor = syncCursors[table]
//     remoteChanges = remote.listChangedSince(cursor.lastSyncedAt)
//     for each record in remoteChanges:
//       local = local.getById(record.id)
//       if local == null:                    → 插入
//       if local.version < record.version:   → 覆盖(远端更新)
//       if local.version > record.version:   → 冲突,进入解决
//     syncCursors[table] = 远端返回的最新时间
//
// push():
//   localChanges = local.listChangedSince(lastPushedAt)   // 含软删除
//   for each record:
//     remote.upsert(record)
//   记录 push 游标
//
// resolveConflicts():
//   策略:最后写入胜出(LWW) + 提示用户
//   → 比较 updated_at,新者胜出
//   → 重要冲突(同一搭配被两设备改)可弹窗让用户选
//
// 图片同步(不走 DB):
// - push:检查本地 imageRemoteUrl == null 的图片,上传到云端,回写 URL
// - pull:远端有 URL 但本地无文件,下载到 originals/
//
// 触发同步时机(未来):
// - App 启动后
// - 写操作后(防抖 5 秒)
// - 手动点"立即同步"
// - 网络从离线恢复在线时
//
// 未来实现步骤:
// 1. 在 data/remote/supabase/ 下实现 SupabaseSyncEngine
// 2. 复用各 Repository 的 listChangedSince 方法
// 3. 在 infra/di/bindings.ts 把 ISyncEngine 绑定切换为 SupabaseSyncEngine
// 4. 在 config.ts 把 syncEnabled 置 true
