// 本地图片存储:存到 FileSystem.documentDirectory/wardrobe/ 下
// DB 只存相对路径,读取时拼 file:// 绝对路径(便于同步迁移)
// 使用 expo-file-system v57 新 API(File/Directory/Paths)
import { File, Directory, Paths } from 'expo-file-system';
import type { IAssetStore } from '../../../domain/repositories/IAssetStore';

// wardrobe 根目录:{documentDirectory}/wardrobe/
const WARDROBE_DIR = new Directory(Paths.document, 'wardrobe');

// 确保目录存在(递归创建)
function ensureDir(dir: Directory): void {
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
}

// 根据文件名推断子目录(约定:orig_xxx → originals/, thumb_xxx → thumbs/, outfit_xxx → outfits/)
function inferSubdir(filename: string): string {
  if (filename.startsWith('thumb_')) return 'thumbs';
  if (filename.startsWith('outfit_')) return 'outfits';
  return 'originals';
}

export class LocalAssetStore implements IAssetStore {
  // 把临时 uri(如 cache://...)的图片复制到持久化目录,返回相对路径
  async save(localUri: string, filename: string): Promise<string> {
    ensureDir(WARDROBE_DIR);
    const subdir = inferSubdir(filename);          // originals/ thumbs/ outfits/
    const targetDir = new Directory(WARDROBE_DIR, subdir);
    ensureDir(targetDir);
    const targetFile = new File(targetDir, filename);
    // 源文件:file:// URI 或 content:// URI,File 构造函数直接接受
    const src = new File(localUri);
    await src.copy(targetFile);
    return `${subdir}/${filename}`;                // 相对路径,存 DB
  }

  // 读取:相对路径 → file:// 绝对路径
  async read(path: string): Promise<string> {
    if (path.startsWith('file://') || path.startsWith('http')) return path;
    const f = new File(WARDROBE_DIR, ...path.split('/'));
    return f.uri;
  }

  async delete(path: string): Promise<void> {
    let f: File;
    if (path.startsWith('file://') || path.startsWith('content://')) {
      f = new File(path);
    } else {
      f = new File(WARDROBE_DIR, ...path.split('/'));
    }
    if (f.exists) {
      f.delete();
    }
  }

  // 本地实现:直接返回 file:// 路径(云端实现返回公网 URL)
  async getPublicUrl(path: string): Promise<string> {
    if (path.startsWith('file://') || path.startsWith('http')) return path;
    const f = new File(WARDROBE_DIR, ...path.split('/'));
    return f.uri;
  }
}
