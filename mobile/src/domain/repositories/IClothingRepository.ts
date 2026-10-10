import type { Clothing, ClothingInput, ClothingFilter } from '../entities/Clothing';

export interface IClothingRepository {
  create(input: ClothingInput): Promise<Clothing>;
  update(id: string, patch: Partial<ClothingInput>): Promise<Clothing>;
  softDelete(id: string): Promise<void>;
  getById(id: string): Promise<Clothing | null>;
  list(filter?: ClothingFilter): Promise<Clothing[]>;
  listByIds(ids: string[]): Promise<Clothing[]>;
  // 同步用(本阶段接口预留,本地实现可返回空)
  listChangedSince(since: number): Promise<Clothing[]>;
  // 标签关联(多对多)
  setTags(clothingId: string, tagIds: string[]): Promise<void>;
  getTagIds(clothingId: string): Promise<string[]>;
}
