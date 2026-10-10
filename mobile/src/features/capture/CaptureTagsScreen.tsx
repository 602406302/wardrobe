// 录入流程:标签选择 + 入库
// 入参:裁剪后的图片 URI 数组
// 产出:逐张保存图片 -> 创建衣物 -> 关联标签 -> 回到衣橱
// UI 1:1 迁移自原型 _1/code.html,className 原样复制,业务逻辑保留
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { container, TOKENS } from '../../infra/di/container';
import type { IClothingRepository } from '../../domain/repositories/IClothingRepository';
import type { ITagRepository } from '../../domain/repositories/ITagRepository';
import type { IAssetStore } from '../../domain/repositories/IAssetStore';
import type { IImageProcessor } from '../../domain/repositories/IImageProcessor';
import type { Tag } from '../../domain/entities/Tag';
import { v4 as uuid } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'CaptureTags'>;

// 预设主要颜色色块(名称与种子 color 标签匹配)
const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: '白', hex: '#FFFFFF' },
  { name: '黑', hex: '#000000' },
  { name: '灰', hex: '#9E9E9E' },
  { name: '米色', hex: '#E5D3B3' },
  { name: '深蓝', hex: '#1A237E' },
  { name: '深绿', hex: '#1B5E20' },
  { name: '深红', hex: '#8B0000' },
];

export function CaptureTagsScreen({ navigation, route }: Props) {
  const { uris } = route.params;
  const insets = useSafeAreaInsets();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [activeL1Id, setActiveL1Id] = useState<string>('');

  const clothingRepo = container.get<IClothingRepository>(TOKENS.IClothingRepository);
  const tagRepo = container.get<ITagRepository>(TOKENS.ITagRepository);
  const assetStore = container.get<IAssetStore>(TOKENS.IAssetStore);
  const imageProcessor = container.get<IImageProcessor>(TOKENS.IImageProcessor);

  useEffect(() => {
    tagRepo
      .list()
      .then((loaded) => {
        setTags(loaded);
        const firstL1 = loaded.find((t) => t.type === 'category_l1');
        if (firstL1) setActiveL1Id(firstL1.id);
      })
      .catch(() => {});
  }, [tagRepo]);

  const toggleTag = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // 主分类单选:切换激活的一级分类,同时更新已选标签
  const selectL1 = (id: string) => {
    setActiveL1Id(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      l1Tags.forEach((t) => {
        if (t.id !== id) next.delete(t.id);
      });
      next.add(id);
      return next;
    });
  };

  const addCustomTag = async () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    const created = await tagRepo.create({ type: 'custom', name: trimmed });
    setTags((prev) => [...prev, created]);
    setSelectedIds((prev) => new Set(prev).add(created.id));
    setCustomName('');
    setShowAddCustom(false);
  };

  const handleSave = useCallback(async () => {
    if (uris.length === 0) return;
    setSaving(true);
    try {
      const tagIds = Array.from(selectedIds);
      for (const uri of uris) {
        // 1. 抠图(直通版原样返回)
        const processed = await imageProcessor.removeBackground(uri);
        // 2. 保存原图
        const filename = `orig_${uuid()}.png`;
        const relPath = await assetStore.save(processed, filename);
        // 3. 生成缩略图
        const thumbUri = await imageProcessor.generateThumb(processed);
        const thumbFilename = `thumb_${uuid()}.jpg`;
        const thumbPath = await assetStore.save(thumbUri, thumbFilename);
        // 4. 获取尺寸
        const size = await imageProcessor.getSize(processed);
        // 5. 创建衣物 + 关联标签
        const clothing = await clothingRepo.create({
          name: name || null,
          note: note || null,
          imageLocalPath: relPath,
          imageThumbPath: thumbPath,
          width: size.width,
          height: size.height,
        });
        if (tagIds.length > 0) {
          await clothingRepo.setTags(clothing.id, tagIds);
        }
      }
      Alert.alert('入库成功', `已添加 ${uris.length} 件衣物`, [
        { text: '好的', onPress: () => navigation.navigate('Tabs' as never) },
      ]);
    } catch (e) {
      Alert.alert('入库失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setSaving(false);
    }
  }, [uris, selectedIds, name, note, imageProcessor, assetStore, clothingRepo, navigation]);

  // 分组标签
  const l1Tags = tags.filter((t) => t.type === 'category_l1');
  const l2Tags = tags.filter((t) => t.type === 'category_l2');
  const colorTags = tags.filter((t) => t.type === 'color');

  // 二级品类按一级分组
  const l2ByL1 = (l1Id: string) => l2Tags.filter((t) => t.parentId === l1Id);

  // 已选标签列表(用于胶囊展示)
  const selectedTags = tags.filter((t) => selectedIds.has(t.id));

  // 按名称查找颜色标签
  const findColorTag = (colorName: string) =>
    colorTags.find((t) => t.name === colorName);

  if (saving) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#24389c" />
        <Text className="mt-4 font-inter text-sm text-on-surface-variant">正在入库...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      {/* ===== 顶部导航栏(固定,毛玻璃近似,避开状态栏) ===== */}
      <View
        className="absolute left-0 right-0 z-50 h-16 bg-surface/70 border-b border-outline-variant/30 flex-row items-center justify-between px-container-padding-mobile"
        style={{ top: insets.top }}
      >
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            className="p-2 rounded-full"
          >
            <MaterialIcons name="arrow-back" size={24} color="#24389c" />
          </TouchableOpacity>
          <Text className="font-display-lg text-title-md text-primary tracking-tight">
            添加衣物
          </Text>
        </View>
        <View className="w-8 h-8 rounded-full bg-surface-container overflow-hidden items-center justify-center">
          <MaterialIcons name="person" size={20} color="#454652" />
        </View>
      </View>

      {/* ===== 内容区 ===== */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 64, paddingHorizontal: 20, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ----- 预览图区域 ----- */}
        <View className="py-stack-md items-center">
          <View className="relative">
            <View className="w-48 h-64 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface shadow-sm">
              {uris[0] ? (
                <Image
                  source={{ uri: uris[0] }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : null}
            </View>
            {/* 右下角悬浮编辑按钮 */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
              className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-full items-center justify-center"
              style={{
                elevation: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              }}
            >
              <MaterialIcons name="edit" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ----- 分类预设区域 ----- */}
        <View className="mb-stack-md">
          <Text className="font-title-md text-title-md mb-stack-sm text-on-surface">
            分类预设
          </Text>

          {/* 主分类胶囊 - 横向滚动 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
          >
            {l1Tags.map((l1) => {
              const selected = activeL1Id === l1.id;
              return (
                <TouchableOpacity
                  key={l1.id}
                  onPress={() => selectL1(l1.id)}
                  activeOpacity={0.7}
                  className={
                    selected
                      ? 'px-6 py-2 rounded-full bg-primary-container text-on-primary'
                      : 'px-6 py-2 rounded-full border border-outline-variant/50 bg-surface-container-low'
                  }
                >
                  <Text
                    className={
                      selected
                        ? 'font-medium text-on-primary'
                        : 'font-medium text-on-surface-variant'
                    }
                  >
                    {l1.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 子分类胶囊 - flex-wrap */}
          <View className="mt-stack-sm flex-row flex-wrap" style={{ gap: 8 }}>
            {l2ByL1(activeL1Id).map((l2) => {
              const selected = selectedIds.has(l2.id);
              return (
                <TouchableOpacity
                  key={l2.id}
                  onPress={() => toggleTag(l2.id)}
                  activeOpacity={0.7}
                  className={
                    selected
                      ? 'px-4 py-1.5 rounded-full border border-primary/20 bg-primary-container/20'
                      : 'px-4 py-1.5 rounded-full border border-outline-variant/30'
                  }
                >
                  <Text
                    className={
                      selected
                        ? 'font-body-sm text-primary font-medium'
                        : 'font-body-sm text-on-surface-variant'
                    }
                  >
                    {l2.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ----- 颜色选择器 ----- */}
        <View className="mb-stack-md">
          <Text className="font-title-md text-title-md mb-stack-sm text-on-surface">
            主要颜色
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 16 }}>
            {PRESET_COLORS.map((c) => {
              const tag = findColorTag(c.name);
              const selected = tag ? selectedIds.has(tag.id) : false;
              return (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => {
                    if (tag) toggleTag(tag.id);
                  }}
                  activeOpacity={0.7}
                  className="w-10 h-10 items-center justify-center rounded-full"
                  style={{
                    borderWidth: 2,
                    borderColor: selected ? '#24389c' : 'transparent',
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full"
                    style={{
                      backgroundColor: c.hex,
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                    }}
                  />
                </TouchableOpacity>
              );
            })}
            {/* 自定义颜色(虚线边框 + palette 图标) */}
            <View className="w-10 h-10 rounded-full items-center justify-center bg-surface-container-high border border-dashed border-outline">
              <MaterialIcons name="palette" size={14} color="#757684" />
            </View>
          </View>
        </View>

        {/* ----- 标签与备注 ----- */}
        <View style={{ gap: 24 }}>
          {/* 自定义标签 */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-label-caps text-label-caps text-outline">
                自定义标签
              </Text>
              <TouchableOpacity onPress={() => setShowAddCustom(true)} activeOpacity={0.7}>
                <MaterialIcons name="add" size={20} color="#24389c" />
              </TouchableOpacity>
            </View>
            <TextInput
              className="border-b border-outline-variant py-2 font-body-lg text-on-surface"
              placeholder="输入标签按回车..."
              placeholderTextColor="#75768499"
              value={customName}
              onChangeText={setCustomName}
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
            />
            {/* 已选标签胶囊 */}
            {selectedTags.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
                {selectedTags.map((t) => (
                  <View
                    key={t.id}
                    className="flex-row items-center gap-1 px-3 py-1 bg-secondary-container/30 border border-secondary-container/50 rounded-lg"
                  >
                    <Text className="font-body-sm text-on-secondary-container">
                      # {t.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => toggleTag(t.id)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialIcons name="close" size={14} color="#586861" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          {/* 备注 */}
          <View>
            <Text className="font-label-caps text-label-caps text-outline mb-2">
              备注信息
            </Text>
            <TextInput
              className="bg-surface-container-low/50 rounded-xl border border-outline-variant/30 p-4 font-body-sm text-on-surface"
              style={{ minHeight: 84, textAlignVertical: 'top' }}
              placeholder="添加面料、洗涤要求或购买来源..."
              placeholderTextColor="#75768499"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* ===== 底部固定操作按钮 ===== */}
      <View className="absolute bottom-0 left-0 right-0 px-container-padding-mobile pb-6 pt-4 bg-surface">
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          className="w-full h-14 bg-primary rounded-2xl flex-row items-center justify-center gap-3"
          style={{
            elevation: 8,
            shadowColor: '#24389c',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
          }}
        >
          <MaterialIcons name="inventory-2" size={24} color="#ffffff" />
          <Text className="font-title-md text-title-md text-on-primary">完成并入库</Text>
        </TouchableOpacity>
      </View>

      {/* ===== 新增自定义标签弹窗 ===== */}
      <Modal
        visible={showAddCustom}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCustom(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-8">
          <View className="w-full rounded-2xl bg-white p-5">
            <Text className="font-manrope text-base font-semibold text-on-surface">
              新增自定义标签
            </Text>
            <TextInput
              className="mt-3 rounded-xl border border-outline px-4 py-3 font-inter text-sm"
              placeholder="标签名称"
              placeholderTextColor="#757684"
              value={customName}
              onChangeText={setCustomName}
              autoFocus
              onSubmitEditing={addCustomTag}
            />
            <View className="mt-4 flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowAddCustom(false)}
                activeOpacity={0.7}
                className="flex-1 items-center rounded-xl border border-outline-variant py-3"
              >
                <Text className="font-inter text-sm text-on-surface">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addCustomTag}
                activeOpacity={0.85}
                className="flex-1 items-center rounded-xl bg-primary py-3"
              >
                <Text className="font-inter text-sm font-semibold text-on-primary">添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
