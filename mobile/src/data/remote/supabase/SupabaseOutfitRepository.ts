// 云端搭配 Repository 占位(未来实现)
import type { IOutfitRepository } from '../../../domain/repositories/IOutfitRepository';
import type { Outfit, OutfitInput } from '../../../domain/entities/Outfit';
import { NotImplementedError } from '../../../infra/errors';

export class SupabaseOutfitRepository implements IOutfitRepository {
  create(_input: OutfitInput): Promise<Outfit> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  update(_id: string, _patch: Partial<OutfitInput>): Promise<Outfit> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  softDelete(_id: string): Promise<void> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  getById(_id: string): Promise<Outfit | null> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  list(): Promise<Outfit[]> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  listChangedSince(_since: number): Promise<Outfit[]> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
}
