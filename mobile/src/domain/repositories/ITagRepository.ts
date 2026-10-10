import type { Tag, TagInput, TagType } from '../entities/Tag';

export interface ITagRepository {
  create(input: TagInput): Promise<Tag>;
  update(id: string, patch: Partial<TagInput>): Promise<Tag>;
  softDelete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<void>;
  list(type?: TagType): Promise<Tag[]>;
  listChangedSince(since: number): Promise<Tag[]>;
}
