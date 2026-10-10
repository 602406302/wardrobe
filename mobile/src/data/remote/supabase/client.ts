// Supabase 客户端占位
// 未来接云端时在此初始化,并在 bindings.ts 切换绑定
import { config } from '../../../infra/config';
import { NotImplementedError } from '../../../infra/errors';

let _client: unknown = null;

export async function getSupabaseClient(): Promise<unknown> {
  if (!config.cloudEnabled) {
    throw new NotImplementedError('云端未启用,见 DEVELOPMENT.md §7');
  }
  if (_client) return _client;

  // TODO 未来实现:
  // import { createClient } from '@supabase/supabase-js';
  // _client = createClient(config.supabaseUrl, config.supabaseAnonKey);
  throw new NotImplementedError('Supabase 客户端待初始化,见 data/remote/README.md');
}
