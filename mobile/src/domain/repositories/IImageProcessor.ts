// 图片处理抽象:裁剪 + 抠图
// 本阶段:直通实现(只裁剪,不抠图),用 expo-image-manipulator
// 未来:OnnxImageProcessor 用 ONNX RMBG-1.4 模型本地抠图(需 EAS Build)
export interface IImageProcessor {
  // 裁剪:按指定区域裁剪图片,返回新 URI
  crop(input: CropInput): Promise<string>;
  // 抠图:去除背景,返回透明背景 PNG 的 URI
  // 直通实现原样返回;ONNX 实现做背景分割
  removeBackground(uri: string): Promise<string>;
  // 生成缩略图
  generateThumb(uri: string, maxSide?: number): Promise<string>;
  // 获取图片尺寸
  getSize(uri: string): Promise<{ width: number; height: number }>;
}

export interface CropInput {
  uri: string;
  // 裁剪区域(基于原图像素)
  originX: number;
  originY: number;
  width: number;
  height: number;
}
