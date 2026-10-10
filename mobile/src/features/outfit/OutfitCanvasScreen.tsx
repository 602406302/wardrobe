// 搭配画布:衣物贴纸的拖拽/缩放/选中/删除 + 保存
// 用 RN 原生 PanResponder 实现,无需 reanimated/gesture-handler(Expo Go 兼容)
// UI 1:1 迁移自原型 _2/code.html,className 原样复制,PanResponder 逻辑保留
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  ScrollView,
  Animated,
} from 'react-native';
import type { PanResponderGestureState } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { container, TOKENS } from '../../infra/di/container';
import type { IOutfitRepository } from '../../domain/repositories/IOutfitRepository';
import type { IClothingRepository } from '../../domain/repositories/IClothingRepository';
import type { IAssetStore } from '../../domain/repositories/IAssetStore';
import type { OutfitItemPlacement } from '../../domain/entities/Outfit';
import type { Clothing } from '../../domain/entities/Clothing';
import { ClothingPicker } from './ClothingPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'OutfitCanvas'>;

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const NAV_H = 64;
const TRAY_DEFAULT_H = 180;
const TRAY_MIN_H = 120;
const TRAY_MAX_H = 400;
// 画布内容总高度(比可见区域大,允许上下滚动)
const CANVAS_H = Math.floor(SCREEN_H * 1.3);
const STICKER_BASE = 120; // 贴纸基础尺寸
const PRIMARY = '#24389c';
const INACTIVE = '#454652';

// 点阵背景纹理(JS 生成网格小点 View 数组,近似 radial-gradient 点阵)
const DOT_GAP = 24;
const DOT_SIZE = 2;
const DOTS: Array<{ left: number; top: number }> = [];
{
  const cols = Math.floor(SCREEN_W / DOT_GAP);
  const rows = Math.floor(CANVAS_H / DOT_GAP);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      DOTS.push({
        left: c * DOT_GAP + (DOT_GAP - DOT_SIZE) / 2,
        top: r * DOT_GAP + (DOT_GAP - DOT_SIZE) / 2,
      });
    }
  }
}

// 底部托盘分类标签
const CATEGORIES = ['上装', '下装', '外套', '鞋履', '配饰'];
const SUB_CATEGORIES = ['全部', '短袖', '长袖', '衬衫', '卫衣'];

interface CanvasItem extends OutfitItemPlacement {
  uri: string;
  width: number;
  height: number;
}

export function OutfitCanvasScreen({ navigation, route }: Props) {
  const editingId = route.params?.editingId;
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState(0);
  const [subCategory, setSubCategory] = useState(0);
  // 用 Animated.Value 驱动托盘高度,直接走原生动画系统,避免每帧 re-render 卡顿
  const trayHeight = useRef(new Animated.Value(TRAY_DEFAULT_H)).current;
  // 同步当前高度值,供 PanResponder grant 读取(Animated.Value 不能直接 .value 读取)
  const trayHeightRef = useRef(TRAY_DEFAULT_H);
  const trayStartHRef = useRef(TRAY_DEFAULT_H);
  useEffect(() => {
    const id = trayHeight.addListener(({ value }) => {
      trayHeightRef.current = value;
    });
    return () => trayHeight.removeListener(id);
  }, [trayHeight]);

  // 上拉手柄拖拽 PanResponder:直接写 Animated.Value,不触发 React re-render
  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        trayStartHRef.current = trayHeightRef.current;
      },
      onPanResponderMove: (_, g) => {
        // 上拉 dy 为负,高度增加
        const newH = Math.max(TRAY_MIN_H, Math.min(TRAY_MAX_H, trayStartHRef.current - g.dy));
        trayHeight.setValue(newH);
      },
    })
  ).current;

  const outfitRepo = container.get<IOutfitRepository>(TOKENS.IOutfitRepository);
  const clothingRepo = container.get<IClothingRepository>(TOKENS.IClothingRepository);
  const assetStore = container.get<IAssetStore>(TOKENS.IAssetStore);

  // 加载编辑数据
  useEffect(() => {
    const load = async () => {
      try {
        if (editingId) {
          const outfit = await outfitRepo.getById(editingId);
          if (outfit) {
            setName(outfit.name);
            setNote(outfit.note ?? '');
            const canvasItems: CanvasItem[] = [];
            for (const p of outfit.canvasData) {
              const c = await clothingRepo.getById(p.clothingId);
              if (c) {
                const rel = c.imageThumbPath ?? c.imageLocalPath;
                const uri = await assetStore.getPublicUrl(rel);
                canvasItems.push({
                  ...p,
                  uri,
                  width: STICKER_BASE,
                  height: STICKER_BASE,
                });
              }
            }
            setItems(canvasItems);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editingId, outfitRepo, clothingRepo, assetStore]);

  // 从选衣条添加衣物
  const handlePick = useCallback((c: Clothing) => {
    const rel = c.imageThumbPath ?? c.imageLocalPath;
    assetStore.getPublicUrl(rel).then((uri) => {
      const newItem: CanvasItem = {
        clothingId: c.id,
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: 0,
        zIndex: items.length,
        uri,
        width: STICKER_BASE,
        height: STICKER_BASE,
      };
      setItems((prev) => [...prev, newItem]);
      setSelectedIdx(items.length);
    });
  }, [items.length, assetStore]);

  // 删除选中
  const handleDelete = useCallback(() => {
    if (selectedIdx === null) return;
    setItems((prev) => prev.filter((_, i) => i !== selectedIdx));
    setSelectedIdx(null);
  }, [selectedIdx]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入搭配名称');
      return;
    }
    setSaving(true);
    try {
      const canvasData: OutfitItemPlacement[] = items.map((it) => ({
        clothingId: it.clothingId,
        x: it.x,
        y: it.y,
        scale: it.scale,
        rotation: it.rotation,
        zIndex: it.zIndex,
      }));
      if (editingId) {
        await outfitRepo.update(editingId, { name: name.trim(), note: note.trim() || null, canvasData });
      } else {
        await outfitRepo.create({ name: name.trim(), note: note.trim() || null, canvasData });
      }
      Alert.alert('成功', '搭配已保存', [{ text: '好的', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('保存失败', e instanceof Error ? e.message : '');
    } finally {
      setSaving(false);
    }
  }, [name, note, items, editingId, outfitRepo, navigation]);

  // 把保存按钮放到原生导航栏 header 右侧(搭配画布标题右边)
  // 必须在 loading 早返回之前调用,否则违反 Hooks 规则
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowSave(true)}
          activeOpacity={0.85}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, backgroundColor: '#24389c' }}
        >
          <MaterialIcons name="save" size={14} color="#ffffff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 }}>
            保存
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#24389c" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      {/* ============ 画布区域(可上下滚动查看更多内容) ============ */}
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ height: CANVAS_H }}>
          {/* 点阵背景纹理 */}
          {DOTS.map((d, i) => (
            <View
              key={i}
              style={{ position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(197,197,212,0.5)', left: d.left, top: d.top }}
            />
          ))}

          {/* 人体轮廓引导线(虚线 border, opacity-20) */}
          <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 48, opacity: 0.2 }}
            pointerEvents="none"
          >
            <View style={{ width: 96, height: 96, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9e9eac', borderRadius: 48 }} />
            <View style={{ width: 192, height: 256, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9e9eac', borderRadius: 12 }} />
            <View style={{ width: 160, height: 320, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9e9eac', borderRadius: 12, marginTop: 16 }} />
            <View style={{ flexDirection: 'row', gap: 48, marginTop: 16 }}>
              <View style={{ width: 80, height: 48, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9e9eac', borderRadius: 8 }} />
              <View style={{ width: 80, height: 48, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9e9eac', borderRadius: 8 }} />
            </View>
          </View>

          {/* 可拖拽衣物贴纸 */}
          {items.map((item, idx) => (
            <StickerItem
              key={`${item.clothingId}-${idx}`}
              item={item}
              selected={selectedIdx === idx}
              onSelect={() => setSelectedIdx(idx)}
              onChange={(x, y, scale) => {
                setItems((prev) =>
                  prev.map((it, i) => (i === idx ? { ...it, x, y, scale } : it))
                );
              }}
            />
          ))}

          {/* 空状态提示 */}
          {items.length === 0 && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, color: '#9e9eac' }}>从下方选衣条添加衣物</Text>
            </View>
          )}
        </ScrollView>

        {/* 选中时显示删除按钮(浮在ScrollView之上) */}
        {selectedIdx !== null && (
          <TouchableOpacity
            style={{ position: 'absolute', top: 16, left: 16, backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, zIndex: 100, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete" size={14} color="#ffffff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>删除</Text>
          </TouchableOpacity>
        )}

        {/* 右侧悬浮工具栏(3 个 48x48 圆形半透明按钮) */}
        <View
          style={{ position: 'absolute', right: 24, top: '50%', flexDirection: 'column', gap: 16, transform: [{ translateY: -80 }] }}
        >
          <TouchableOpacity onPress={() => setItems([])} activeOpacity={0.7}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(220,220,229,0.8)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="delete-sweep" size={22} color="#454652" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(220,220,229,0.8)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="auto-fix-high" size={22} color="#454652" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(220,220,229,0.8)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="ios-share" size={22} color="#454652" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ============ 底部衣物选择托盘(可上拉拖拽变大) ============ */}
      <Animated.View style={{ height: trayHeight, backgroundColor: 'rgba(249,249,252,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(197,197,212,0.2)' }}>
        {/* 上拉手柄 - 拖拽调整高度 (绝对定位 top:0, 高度固定 20) */}
        <View
          {...handlePanResponder.panHandlers}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#c5c5d4' }} />
        </View>

        {/* 第一层:分类标签 (绝对定位 top:20, 高度固定 28) */}
        <View style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 28, borderBottomWidth: 1, borderBottomColor: 'rgba(197,197,212,0.1)' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 20,
              paddingHorizontal: 24,
              height: 28,
            }}
          >
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(i)}
                activeOpacity={0.7}
                style={i === category ? { borderBottomWidth: 2, borderBottomColor: PRIMARY, paddingBottom: 2 } : { paddingBottom: 2 }}
              >
                <Text
                  style={i === category
                    ? { fontSize: 11, fontWeight: 'bold', color: PRIMARY }
                    : { fontSize: 11, fontWeight: '500', color: INACTIVE }
                  }
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 第二层:子分类胶囊 (绝对定位 top:48, 高度固定 32) */}
        <View style={{ position: 'absolute', top: 48, left: 0, right: 0, height: 32, justifyContent: 'center' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 24,
              height: 32,
            }}
          >
            {SUB_CATEGORIES.map((sub, i) => (
              <TouchableOpacity
                key={sub}
                onPress={() => setSubCategory(i)}
                activeOpacity={0.7}
                style={i === subCategory
                  ? { paddingHorizontal: 14, paddingVertical: 3, borderRadius: 9999, backgroundColor: PRIMARY }
                  : { paddingHorizontal: 14, paddingVertical: 3, borderRadius: 9999, backgroundColor: '#e9e9f1' }
                }
              >
                <Text
                  style={i === subCategory
                    ? { fontSize: 12, color: '#fff', fontWeight: '500' }
                    : { fontSize: 12, color: INACTIVE, fontWeight: '500' }
                  }
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 第三层:衣物卡片横滑列表 (绝对定位 top:80, bottom:0 占满剩余,可滚动) */}
        <View style={{ position: 'absolute', top: 80, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          <ClothingPicker onPick={handlePick} />
        </View>
      </Animated.View>

      {/* ============ 保存弹窗 ============ */}
      <Modal visible={showSave} transparent animationType="fade" onRequestClose={() => setShowSave(false)}>
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="w-[85%] bg-surface-container-lowest rounded-2xl p-5">
            <Text className="font-title-md text-title-md text-on-surface mb-4">保存搭配</Text>
            <TextInput
              className="border border-surface-variant rounded-lg px-3 py-2.5 text-body-sm text-on-surface mb-3"
              placeholder="搭配名称"
              placeholderTextColor="#757684"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              className="border border-surface-variant rounded-lg px-3 py-2.5 text-body-sm text-on-surface mb-3 h-20"
              placeholder="备注(可选)"
              placeholderTextColor="#757684"
              value={note}
              onChangeText={setNote}
              multiline
            />
            <View className="flex-row gap-3 mt-1">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-surface-variant items-center"
                onPress={() => setShowSave(false)}
              >
                <Text className="font-body-sm text-outline">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-primary items-center"
                onPress={handleSave}
                disabled={saving}
              >
                <Text className="font-body-sm text-on-primary font-semibold">
                  {saving ? '保存中...' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============ 单个贴纸组件(用 PanResponder 实现拖拽+双指缩放) ============
interface StickerProps {
  item: CanvasItem;
  selected: boolean;
  onSelect: () => void;
  onChange: (x: number, y: number, scale: number) => void;
}

function StickerItem({ item, selected, onSelect, onChange }: StickerProps) {
  // 用 ref 存实时位置,PanResponder 闭包里能读到
  const posRef = useRef({
    x: item.x * SCREEN_W,
    y: item.y * CANVAS_H,
    scale: item.scale,
  });
  // 拖拽起始基准
  const startRef = useRef({ x: 0, y: 0, scale: 1 });
  // 双指缩放起始距离
  const pinchStartRef = useRef({ dist: 0, scale: 1 });
  // 触发重渲染
  const [, setTick] = useState(0);
  const update = (patch: Partial<typeof posRef.current>) => {
    posRef.current = { ...posRef.current, ...patch };
    setTick((t) => t + 1);
  };
  // onChange 回调用 ref 避免 PanResponder 闭包陷阱
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        onSelectRef.current();
        return true;
      },
      onMoveShouldSetPanResponder: (_, g) => {
        onSelectRef.current();
        return Math.abs(g.dx) > 1 || Math.abs(g.dy) > 1 || g.numberActiveTouches >= 2;
      },
      onPanResponderGrant: (_, g) => {
        // 记录拖拽起始基准
        startRef.current = {
          x: posRef.current.x - g.dx,
          y: posRef.current.y - g.dy,
          scale: posRef.current.scale,
        };
        // 双指缩放:记录起始距离
        if (g.numberActiveTouches >= 2) {
          pinchStartRef.current = {
            dist: pinchDistance((g as PanResponderGestureState & { touches: Array<{ pageX: number; pageY: number }> }).touches),
            scale: posRef.current.scale,
          };
        }
      },
      onPanResponderMove: (_, g) => {
        // 双指缩放优先
        if (g.numberActiveTouches >= 2 && pinchStartRef.current.dist > 0) {
          const dist = pinchDistance((g as PanResponderGestureState & { touches: Array<{ pageX: number; pageY: number }> }).touches);
          const ratio = dist / pinchStartRef.current.dist;
          const newScale = Math.max(0.3, Math.min(3, pinchStartRef.current.scale * ratio));
          update({ scale: newScale });
          return;
        }
        // 单指拖拽
        update({
          x: startRef.current.x + g.dx,
          y: startRef.current.y + g.dy,
        });
      },
      onPanResponderRelease: () => {
        const p = posRef.current;
        const nx = Math.max(0, Math.min(1, p.x / SCREEN_W));
        const ny = Math.max(0, Math.min(1, p.y / CANVAS_H));
        onChangeRef.current(nx, ny, p.scale);
      },
      // 阻止 ScrollView 接管贴纸拖拽手势
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const p = posRef.current;

  return (
    <View
      {...panResponder.panHandlers}
      className={`absolute left-0 top-0 ${selected ? 'border-2 border-primary rounded-md' : ''}`}
      style={{
        transform: [
          { translateX: p.x - STICKER_BASE / 2 },
          { translateY: p.y - STICKER_BASE / 2 },
          { scale: p.scale },
        ],
      }}
    >
      <Image
        source={{ uri: item.uri }}
        style={{ width: STICKER_BASE, height: STICKER_BASE }}
        resizeMode="contain"
      />
    </View>
  );
}

// 计算双指间距离
function pinchDistance(touches: Array<{ pageX: number; pageY: number }>): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}
