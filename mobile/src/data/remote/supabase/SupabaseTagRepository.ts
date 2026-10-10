// 云端标签 Repository 占位(未来实现)
import type { ITagRepository } from '../../../domain/repositories/ITagRepository';
import type { Tag, TagInput, TagType } from '../../../domain/entities/Tag';
import { NotImplementedError } from '../../../infra/errors';

export class SupabaseTagRepository implements ITagRepository {
  create(_input: TagInput): Promise<Tag> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  update(_id: string, _patch: Partial<TagInput>): Promise<Tag> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  softDelete(_id: string): Promise<void> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  reorder(_ids: string[]): Promise<void> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  list(_type?: TagType): Promise<Tag[]> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
  listChangedSince(_since: number): Promise<Tag[]> {
    throw new NotImplementedError('云端实现待开发,见 data/remote/README.md');
  }
}
