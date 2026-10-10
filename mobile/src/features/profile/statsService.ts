// 统计服务:聚合衣物/搭配/标签数据
import { container, TOKENS } from '../../infra/di/container';
import type { IClothingRepository } from '../../domain/repositories/IClothingRepository';
import type { IOutfitRepository } from '../../domain/repositories/IOutfitRepository';
import type { ITagRepository } from '../../domain/repositories/ITagRepository';
import type { Tag } from '../../domain/entities/Tag';

export interface Stats {
  totalClothings: number;
  totalOutfits: number;
  totalTags: number;
  // 按一级品类计数
  byCategoryL1: { tag: Tag; count: number }[];
  // 按颜色计数
  byColor: { tag: Tag; count: number }[];
}

export async function getStats(): Promise<Stats> {
  const clothingRepo = container.get<IClothingRepository>(TOKENS.IClothingRepository);
  const outfitRepo = container.get<IOutfitRepository>(TOKENS.IOutfitRepository);
  const tagRepo = container.get<ITagRepository>(TOKENS.ITagRepository);

  const [clothings, outfits, tags] = await Promise.all([
    clothingRepo.list(),
    outfitRepo.list(),
    tagRepo.list(),
  ]);

  const l1Tags = tags.filter((t) => t.type === 'category_l1');
  const colorTags = tags.filter((t) => t.type === 'color');

  // 统计每件衣物的标签,需要异步查
  const clothingTagMap: Record<string, string[]> = {};
  for (const c of clothings) {
    clothingTagMap[c.id] = await clothingRepo.getTagIds(c.id);
  }

  const countByTag = (tagId: string) =>
    clothings.filter((c) => clothingTagMap[c.id]?.includes(tagId)).length;

  return {
    totalClothings: clothings.length,
    totalOutfits: outfits.length,
    totalTags: tags.filter((t) => t.type === 'custom').length,
    byCategoryL1: l1Tags.map((tag) => ({ tag, count: countByTag(tag.id) })),
    byColor: colorTags.map((tag) => ({ tag, count: countByTag(tag.id) })),
  };
}
