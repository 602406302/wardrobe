// 云端衣物 Repository 占位(未来实现)
import type { IClothingRepository } from '../../../domain/repositories/IClothingRepository';
import type { Clothing, ClothingInput, ClothingFilter } from '../../../domain/entities/Clothing';
import { NotImplementedError } from '../../../infra/errors';

export class SupabaseClothingRepository implements IClothingRepository {
  create(_input: ClothingInput): Promise<Clothing> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  update(_id: string, _patch: Partial<ClothingInput>): Promise<Clothing> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  softDelete(_id: string): Promise<void> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  getById(_id: string): Promise<Clothing | null> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  list(_filter?: ClothingFilter): Promise<Clothing[]> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  listByIds(_ids: string[]): Promise<Clothing[]> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  listChangedSince(_since: number): Promise<Clothing[]> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  setTags(_clothingId: string, _tagIds: string[]): Promise<void> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  getTagIds(_clothingId: string): Promise<string[]> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
}
