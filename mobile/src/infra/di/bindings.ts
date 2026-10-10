import { container, TOKENS } from './container';
import { SqliteClothingRepository } from '../../data/local/repositories/SqliteClothingRepository';
import { SqliteTagRepository } from '../../data/local/repositories/SqliteTagRepository';
import { SqliteOutfitRepository } from '../../data/local/repositories/SqliteOutfitRepository';
import { LocalAssetStore } from '../../data/local/assets/LocalAssetStore';
import { LocalAnonymousAuth } from '../../data/local/auth/LocalAnonymousAuth';
import { NoopSyncEngine } from '../../sync/NoopSyncEngine';
import { PassthroughImageProcessor } from '../../data/local/image/PassthroughImageProcessor';

// ============================================================
// 依赖注入绑定:切换本地/云端的唯一开关
// ============================================================
// 本阶段:全部绑定到本地实现 + NoopSyncEngine
// 未来接云端时,只需把导入的实现类换成 Supabase* 版本即可,业务代码零改动
//
// 未来切换示例:
//   import { SupabaseClothingRepository } from '../../data/remote/supabase/SupabaseClothingRepository';
//   container.singleton(TOKENS.IClothingRepository, () => new SupabaseClothingRepository());
//   其余同理
// ============================================================

export function initBindings() {
  if (initialized) return;
  initialized = true;
  container.singleton(TOKENS.IClothingRepository, () => new SqliteClothingRepository());
  container.singleton(TOKENS.IOutfitRepository, () => new SqliteOutfitRepository());
  container.singleton(TOKENS.ITagRepository, () => new SqliteTagRepository());
  container.singleton(TOKENS.IAssetStore, () => new LocalAssetStore());
  container.singleton(TOKENS.IAuth, () => new LocalAnonymousAuth());
  container.singleton(TOKENS.ISyncEngine, () => new NoopSyncEngine());
  container.singleton(TOKENS.IImageProcessor, () => new PassthroughImageProcessor());
}

// 模块加载即注册,保证在任何 store/screen 之前完成绑定(幂等)
let initialized = false;
initBindings();
