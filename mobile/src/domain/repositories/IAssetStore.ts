// 图片存储抽象:本地实现存文件系统,云端实现存 Supabase Storage
export interface IAssetStore {
  // 保存本地图片到存储,返回相对路径(如 originals/xxx.png)
  save(localUri: string, filename: string): Promise<string>;
  // 读取:本地拼 file:// 返回,云端返回远程 URL
  read(path: string): Promise<string>;
  delete(path: string): Promise<void>;
  // 云端用;本地直接返回 file:// 路径
  getPublicUrl(path: string): Promise<string>;
}
