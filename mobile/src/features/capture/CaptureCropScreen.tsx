// 录入流程:裁剪页
// 入参:待裁剪图片 URI 数组
// 产出:裁剪后 URI 数组 -> 传给标签页
// 交互:可拖动裁剪框(四角调整 + 框体移动),逐张裁剪
// 用 RN 原生 PanResponder 实现,无需 reanimated/gesture-handler(Expo Go 兼容)
// UI 1:1 迁移自原型 _4/code.html,className 原样复制,PanResponder 逻辑保留
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { container, TOKENS } from '../../infra/di/container';
import type { IImageProcessor } from '../../domain/repositories/IImageProcessor';

type Props = NativeStackScreenProps<RootStackParamList, 'CaptureCrop'>;

// 裁剪框默认占图片显示区 80%
const DEFAULT_RATIO = 0.8;
const MIN_CROP = 50;
// 四角控制点
const CORNER_SIZE = 16;
const CORNER_OFFSET = 6;

export function CaptureCropScreen({ navigation, route }: Props) {
  const { uris } = route.params;
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [cropped, setCropped] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [imgLayout, setImgLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imgNatural, setImgNatural] = useState({ width: 0, height: 0 });

  // 用 ref 存最新值,PanResponder 闭包里能读到(避免闭包陷阱)
  const cropRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const layoutRef = useRef(imgLayout);
  layoutRef.current = imgLayout;
  // 触发重渲染的状态
  const [, setCropTick] = useState(0);
  const touchCrop = (patch: Partial<typeof cropRef.current>) => {
    cropRef.current = { ...cropRef.current, ...patch };
    setCropTick((t) => t + 1);
  };

  const imageProcessor = container.get<IImageProcessor>(TOKENS.IImageProcessor);
  const currentUri = uris[index];

  // 图片加载完成后初始化裁剪框
  const onImageLoad = (e: any) => {
    const { width: nw, height: nh } = e.nativeEvent.source;
    setImgNatural({ width: nw, height: nh });
  };

  const onImageLayout = (e: any) => {
    const layout = e.nativeEvent.layout;
    setImgLayout(layout);
    const cw = layout.width * DEFAULT_RATIO;
    const ch = layout.height * DEFAULT_RATIO;
    touchCrop({
      x: layout.x + (layout.width - cw) / 2,
      y: layout.y + (layout.height - ch) / 2,
      w: cw,
      h: ch,
    });
  };

  // 拖动整个裁剪框
  const cropPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderMove: (_, g) => {
        const c = cropRef.current;
        const lay = layoutRef.current;
        const nx = Math.max(lay.x, Math.min(c.x + g.dx, lay.x + lay.width - c.w));
        const ny = Math.max(lay.y, Math.min(c.y + g.dy, lay.y + lay.height - c.h));
        touchCrop({ x: nx, y: ny });
      },
    })
  ).current;

  // 调整裁剪框大小(右下角拖拽)
  const resizePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderMove: (_, g) => {
        const c = cropRef.current;
        const lay = layoutRef.current;
        const newW = Math.max(MIN_CROP, c.w + g.dx);
        const newH = Math.max(MIN_CROP, c.h + g.dy);
        const maxW = lay.x + lay.width - c.x;
        const maxH = lay.y + lay.height - c.y;
        touchCrop({ w: Math.min(newW, maxW), h: Math.min(newH, maxH) });
      },
    })
  ).current;

  const c = cropRef.current;

  // 执行裁剪:屏幕坐标 -> 原图像素坐标
  const doCrop = useCallback(async () => {
    setProcessing(true);
    try {
      const scaleX = imgNatural.width / imgLayout.width;
      const scaleY = imgNatural.height / imgLayout.height;

      const originX = Math.round((c.x - imgLayout.x) * scaleX);
      const originY = Math.round((c.y - imgLayout.y) * scaleY);
      const w = Math.round(c.w * scaleX);
      const h = Math.round(c.h * scaleY);

      const resultUri = await imageProcessor.crop({
        uri: currentUri,
        originX,
        originY,
        width: w,
        height: h,
      });

      const next = [...cropped, resultUri];
      setCropped(next);

      if (index < uris.length - 1) {
        setIndex(index + 1);
      } else {
        navigation.navigate('CaptureTags', { uris: next });
      }
    } catch (e) {
      Alert.alert('裁剪失败', e instanceof Error ? e.message : '');
    } finally {
      setProcessing(false);
    }
  }, [cropped, currentUri, c, imgLayout, imgNatural, imageProcessor, index, navigation, uris.length]);

  // 跳过当前张(不裁剪,直接用原图)
  const skipOne = useCallback(() => {
    const next = [...cropped, currentUri];
    setCropped(next);
    if (index < uris.length - 1) {
      setIndex(index + 1);
    } else {
      navigation.navigate('CaptureTags', { uris: next });
    }
  }, [cropped, currentUri, index, navigation, uris.length]);

  // 重置裁剪框到默认 80%
  const resetCrop = useCallback(() => {
    const lay = imgLayout;
    const cw = lay.width * DEFAULT_RATIO;
    const ch = lay.height * DEFAULT_RATIO;
    touchCrop({
      x: lay.x + (lay.width - cw) / 2,
      y: lay.y + (lay.height - ch) / 2,
      w: cw,
      h: ch,
    });
  }, [imgLayout]);

  return (
    <View className="flex-1 bg-surface">
      {/* 顶部导航栏(固定,毛玻璃近似,避开状态栏) */}
      <View
        className="absolute left-0 right-0 z-50 flex-row justify-between items-center px-container-padding-mobile h-16 bg-surface/70 border-b border-outline-variant/30"
        style={{ top: insets.top }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="w-10 h-10 items-center justify-center rounded-full"
        >
          <MaterialIcons name="close" size={24} color="#454652" />
        </TouchableOpacity>
        <Text className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">
          裁剪调整
        </Text>
        {processing ? (
          <View className="bg-primary rounded-full px-4 py-1.5 items-center justify-center min-w-[56px]">
            <ActivityIndicator color="#ffffff" size="small" />
          </View>
        ) : (
          <TouchableOpacity
            onPress={doCrop}
            activeOpacity={0.85}
            className="bg-primary rounded-full px-4 py-1.5"
          >
            <Text className="font-label-caps text-label-caps text-on-primary tracking-wider">
              保存
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 编辑画布 */}
      <View className="flex-grow flex-col pb-32" style={{ paddingTop: insets.top + 64 }}>
        <View
          className="flex-grow flex items-center justify-center p-gutter relative overflow-hidden bg-surface-container-lowest"
          onLayout={onImageLayout}
        >
          {/* 图片视口区 */}
          <View
            className="relative w-full max-w-[500px] aspect-[3/4] rounded-xl overflow-hidden border border-outline-variant/20 bg-white"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
            onLayout={onImageLayout}
          >
            {currentUri ? (
              <Image
                source={{ uri: currentUri }}
                className="absolute inset-0 w-full h-full"
                resizeMode="contain"
                onLoad={onImageLoad}
              />
            ) : null}
            {/* 半透明黑色蒙版覆盖全图 */}
            <View className="absolute inset-0 bg-black/40" pointerEvents="none" />
          </View>

          {/* 激活裁剪框(可拖动) */}
          <View
            {...cropPanResponder.panHandlers}
            style={{
              position: 'absolute',
              left: c.x,
              top: c.y,
              width: c.w,
              height: c.h,
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              backgroundColor: 'transparent',
            }}
          >
            {/* 三分线网格(2 竖 + 2 横) */}
            <View
              style={{ position: 'absolute', left: '33.333%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }}
              pointerEvents="none"
            />
            <View
              style={{ position: 'absolute', left: '66.666%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' }}
              pointerEvents="none"
            />
            <View
              style={{ position: 'absolute', top: '33.333%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }}
              pointerEvents="none"
            />
            <View
              style={{ position: 'absolute', top: '66.666%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' }}
              pointerEvents="none"
            />

            {/* 四角控制点 */}
            <View
              style={{ position: 'absolute', left: -CORNER_OFFSET, top: -CORNER_OFFSET, width: CORNER_SIZE, height: CORNER_SIZE, borderRadius: 2, backgroundColor: '#ffffff' }}
              pointerEvents="none"
            />
            <View
              style={{ position: 'absolute', right: -CORNER_OFFSET, top: -CORNER_OFFSET, width: CORNER_SIZE, height: CORNER_SIZE, borderRadius: 2, backgroundColor: '#ffffff' }}
              pointerEvents="none"
            />
            <View
              style={{ position: 'absolute', left: -CORNER_OFFSET, bottom: -CORNER_OFFSET, width: CORNER_SIZE, height: CORNER_SIZE, borderRadius: 2, backgroundColor: '#ffffff' }}
              pointerEvents="none"
            />
            <View
              {...resizePanResponder.panHandlers}
              style={{ position: 'absolute', right: -CORNER_OFFSET, bottom: -CORNER_OFFSET, width: CORNER_SIZE, height: CORNER_SIZE, borderRadius: 2, backgroundColor: '#ffffff' }}
            />
          </View>
        </View>
      </View>

      {/* 底部控制栏(固定,毛玻璃近似) */}
      <View
        className="absolute bottom-0 left-0 right-0 z-50 bg-surface/70 border-t border-outline-variant/20"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {/* 操作按钮 */}
        <View className="flex-row justify-around items-center px-4 h-20">
          <TouchableOpacity
            onPress={() => Alert.alert('提示', '旋转功能开发中')}
            activeOpacity={0.7}
            className="items-center gap-1"
          >
            <View className="w-10 h-10 items-center justify-center rounded-full border border-outline-variant/30">
              <MaterialIcons name="rotate-right" size={24} color="#454652" />
            </View>
            <Text className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">
              旋转
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('提示', '比例功能开发中')}
            activeOpacity={0.7}
            className="items-center gap-1"
          >
            <View className="w-10 h-10 items-center justify-center rounded-full border border-outline-variant/30">
              <MaterialIcons name="aspect-ratio" size={24} color="#454652" />
            </View>
            <Text className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">
              比例
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={resetCrop}
            activeOpacity={0.7}
            className="items-center gap-1"
          >
            <View className="w-10 h-10 items-center justify-center rounded-full border border-outline-variant/30">
              <MaterialIcons name="restart-alt" size={24} color="#454652" />
            </View>
            <Text className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">
              重置
            </Text>
          </TouchableOpacity>
        </View>
        {/* 引导提示 */}
        <View className="px-6 pb-6 items-center">
          <Text className="font-body-sm text-outline opacity-80">
            建议使用纯色背景以获得最佳效果
          </Text>
        </View>
      </View>
    </View>
  );
}
