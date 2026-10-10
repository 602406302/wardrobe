// 数据备份导出:把全部数据导出为一个 JSON 文件(图片转 base64 内嵌)
// 用 expo-file-system v57 新 API(File/Directory/Paths) + Sharing API
// 导入同理:读取 JSON → 还原图片文件 → 重建 DB 记录
import { File, Directory, Paths, EncodingType } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { container, TOKENS } from '../../infra/di/container';
import type { IClothingRepository } from '../../domain/repositories/IClothingRepository';
import type { IOutfitRepository } from '../../domain/repositories/IOutfitRepository';
import type { ITagRepository } from '../../domain/repositories/ITagRepository';
import type { IAssetStore } from '../../domain/repositories/IAssetStore';

const BACKUP_DIR = new Directory(Paths.document, 'backups');

function ensureDir(dir: Directory) {
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
}

// 图片转 base64
async function imageToBase64(relPath: string): Promise<string> {
  const assetStore = container.get<IAssetStore>(TOKENS.IAssetStore);
  const absUri = await assetStore.getPublicUrl(relPath);
  // file:// 开头的本地文件,用新 File API 读 base64
  try {
    const file = new File(absUri);
    if (!file.exists) return '';
    return await file.base64();
  } catch {
    return '';
  }
}

export interface BackupData {
  version: number;
  exportedAt: number;
  clothings: any[];
  outfits: any[];
  tags: any[];
  // 图片:relPath → base64
  images: Record<string, string>;
}

// 导出:收集全部数据 + 图片 base64,写成 JSON,调系统分享
export async function exportBackup(): Promise<string> {
  ensureDir(BACKUP_DIR);
  const clothingRepo = container.get<IClothingRepository>(TOKENS.IClothingRepository);
  const outfitRepo = container.get<IOutfitRepository>(TOKENS.IOutfitRepository);
  const tagRepo = container.get<ITagRepository>(TOKENS.ITagRepository);
  const assetStore = container.get<IAssetStore>(TOKENS.IAssetStore);

  const [clothings, outfits, tags] = await Promise.all([
    clothingRepo.list(),
    outfitRepo.list(),
    tagRepo.list(),
  ]);

  // 收集所有需要的图片路径(原图 + 缩略图)
  const imagePaths = new Set<string>();
  for (const c of clothings) {
    if (c.imageLocalPath) imagePaths.add(c.imageLocalPath);
    if (c.imageThumbPath) imagePaths.add(c.imageThumbPath);
  }
  for (const o of outfits) {
    if (o.coverPath) imagePaths.add(o.coverPath);
  }

  // 转 base64
  const images: Record<string, string> = {};
  for (const p of imagePaths) {
    images[p] = await imageToBase64(p);
  }

  // 查衣物-标签关联
  const clothingTags: Record<string, string[]> = {};
  for (const c of clothings) {
    clothingTags[c.id] = await clothingRepo.getTagIds(c.id);
  }

  const data: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    clothings: clothings.map((c) => ({ ...c, tagIds: clothingTags[c.id] ?? [] })),
    outfits,
    tags,
    images,
  };

  const filename = `wardrobe_backup_${Date.now()}.json`;
  const file = new File(BACKUP_DIR, filename);
  file.write(JSON.stringify(data), { encoding: EncodingType.UTF8 });

  // 调系统分享
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: '导出衣橱数据',
    });
  }

  return file.uri;
}

// 导入:从 JSON 文件还原(需要用户选文件,本阶段先提供接口,选文件用 expo-document-picker)
export async function importBackup(filepath: string): Promise<void> {
  const file = new File(filepath);
  const content = await file.text();
  const data = JSON.parse(content) as BackupData;

  const clothingRepo = container.get<IClothingRepository>(TOKENS.IClothingRepository);
  const outfitRepo = container.get<IOutfitRepository>(TOKENS.IOutfitRepository);
  const tagRepo = container.get<ITagRepository>(TOKENS.ITagRepository);

  const wardrobeDir = new Directory(Paths.document, 'wardrobe');
  ensureDir(wardrobeDir);

  // 1. 还原图片文件
  for (const [relPath, base64] of Object.entries(data.images)) {
    if (!base64) continue;
    const parts = relPath.split('/');
    const subdir = parts.length > 1 ? parts[0] : 'originals';
    const filename = parts.length > 1 ? parts.slice(1).join('/') : relPath;
    const subDir = new Directory(wardrobeDir, subdir);
    ensureDir(subDir);
    const imgFile = new File(subDir, filename);
    imgFile.write(base64, { encoding: EncodingType.Base64 });
  }

  // 2. 还原标签(跳过已存在的,按 id 写入)
  // 简化:直接创建,未来加去重逻辑
  for (const tag of data.tags) {
    try {
      await tagRepo.create({ type: tag.type, name: tag.name, parentId: tag.parentId, sortOrder: tag.sortOrder });
    } catch {
      // 已存在则跳过
    }
  }

  // 3. 还原衣物 + 标签关联
  for (const c of data.clothings) {
    const created = await clothingRepo.create({
      name: c.name,
      note: c.note,
      imageLocalPath: c.imageLocalPath,
      imageThumbPath: c.imageThumbPath,
      width: c.width,
      height: c.height,
    });
    if (c.tagIds?.length > 0) {
      await clothingRepo.setTags(created.id, c.tagIds);
    }
  }

  // 4. 还原搭配
  for (const o of data.outfits) {
    await outfitRepo.create({
      name: o.name,
      note: o.note,
      coverPath: o.coverPath,
      canvasData: o.canvasData,
    });
  }
}
