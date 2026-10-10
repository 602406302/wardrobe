import type { Outfit, OutfitInput } from '../entities/Outfit';

export interface IOutfitRepository {
  create(input: OutfitInput): Promise<Outfit>;
  update(id: string, patch: Partial<OutfitInput>): Promise<Outfit>;
  softDelete(id: string): Promise<void>;
  getById(id: string): Promise<Outfit | null>;
  list(): Promise<Outfit[]>;
  listChangedSince(since: number): Promise<Outfit[]>;
}
