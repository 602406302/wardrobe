// 直通图片处理器:只裁剪/压缩,不抠图
// 用 expo-image-manipulator 实现
// 未来替换为 OnnxImageProcessor(ONNX RMBG-1.4 抠图,需 EAS Build)
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import type { IImageProcessor, CropInput } from '../../../domain/repositories/IImageProcessor';

export class PassthroughImageProcessor implements IImageProcessor {
  async crop(input: CropInput): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      input.uri,
      [{ crop: { originX: input.originX, originY: input.originY, width: input.width, height: input.height } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.PNG }
    );
    return result.uri;
  }

  // 直通:不抠图,原样返回(后续 OnnxImageProcessor 替换)
  async removeBackground(uri: string): Promise<string> {
    return uri;
  }

  async generateThumb(uri: string, maxSide = 300): Promise<string> {
    const size = await this.getSize(uri);
    const scale = Math.min(1, maxSide / Math.max(size.width, size.height));
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: Math.round(size.width * scale) } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  async getSize(uri: string): Promise<{ width: number; height: number }> {
    const result = await ImageManipulator.manipulateAsync(uri, [], {});
    return { width: result.width, height: result.height };
  }
}
