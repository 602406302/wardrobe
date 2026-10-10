// 云端图片存储占位(未来用 Supabase Storage)
import type { IAssetStore } from '../../../domain/repositories/IAssetStore';
import { NotImplementedError } from '../../../infra/errors';

export class SupabaseAssetStore implements IAssetStore {
  save(_localUri: string, _filename: string): Promise<string> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  read(_path: string): Promise<string> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  delete(_path: string): Promise<void> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  getPublicUrl(_path: string): Promise<string> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
}
