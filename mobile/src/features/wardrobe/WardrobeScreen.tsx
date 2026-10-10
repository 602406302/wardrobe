// 衣橱页:顶部导航 + 搜索 + 分类筛选 + 瀑布流 + 空状态 + 录入 FAB
// UI 1:1 迁移自原型 _5/code.html,className 原样复制,业务逻辑保留
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../../app/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Clothing } from '../../domain/entities/Clothing';
import { useWardrobeStore } from './wardrobeStore';
import { MasonryGrid } from './MasonryGrid';
import { PreviewModal } from './PreviewModal';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// 一级分类(与种子品类一致)
const L1_CATEGORIES = ['全部', '上装', '下装', '配饰', '鞋子', '连体衣'];
// 二级分类筛选胶囊(原型示例)
const L2_CATEGORIES = ['全部', '短袖', '长袖', '衬衫', '外套', '毛衣'];

export function WardrobeScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const items = useWardrobeStore((s) => s.items);
  const loading = useWardrobeStore((s) => s.loading);
  const keyword = useWardrobeStore((s) => s.keyword);
  const setKeyword = useWardrobeStore((s) => s.setKeyword);
  const refresh = useWardrobeStore((s) => s.refresh);
  const [previewItem, setPreviewItem] = useState<Clothing | null>(null);
  const [l1Active, setL1Active] = useState(0);
  const [l2Selected, setL2Selected] = useState<string[]>([]);

  // 页面聚焦时刷新(从录入页返回后能看到新数据)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const startCapture = () => navigation.navigate('CaptureCamera');

  const handleSearch = (text: string) => {
    setKeyword(text);
    setTimeout(refresh, 0);
  };

  const toggleL2 = (name: string) => {
    if (name === '全部') {
      setL2Selected([]);
      return;
    }
    setL2Selected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const hasFilter =
    !!keyword || useWardrobeStore.getState().selectedTagIds.length > 0;

  return (
    <View className="flex-1 bg-surface">
      {/* 顶部导航栏(固定,毛玻璃近似,避开状态栏) */}
      <View
        className="absolute left-0 right-0 z-50 h-16 bg-surface/70 border-b border-outline-variant/30 items-center justify-center px-container-padding-mobile"
        style={{ top: insets.top }}
      >
        <Text className="font-display-lg text-title-md text-primary tracking-tight">
          衣搭 Wardrobe Palette
        </Text>
      </View>

      {/* 内容区(顶部留出状态栏+导航栏高度) */}
      <View className="flex-1" style={{ paddingTop: insets.top + 64 + 16 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              colors={['#24389c']}
              tintColor="#24389c"
            />
          }
        >
          {/* 搜索栏 */}
          <View className="mb-6 px-container-padding-mobile">
            <View className="flex-row items-center h-12 pl-4 pr-4 bg-surface-container-low rounded-xl">
              <MaterialIcons name="search" size={20} color="#757684" />
              <TextInput
                className="flex-1 ml-3 font-inter text-body-sm text-on-surface"
                placeholder="搜索你的衣橱..."
                placeholderTextColor="#75768499"
                value={keyword}
                onChangeText={handleSearch}
              />
            </View>
          </View>

          {/* 一级分类标签栏(横向滚动) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-8 py-2"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 24 }}
          >
            {L1_CATEGORIES.map((name, i) => {
              const active = i === l1Active;
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => setL1Active(i)}
                  activeOpacity={0.7}
                  className="items-center"
                >
                  <Text
                    className={
                      active
                        ? 'font-label-caps text-label-caps text-primary'
                        : 'font-label-caps text-label-caps text-on-surface-variant'
                    }
                  >
                    {name}
                  </Text>
                  {active ? (
                    <View className="mt-1 w-1 h-1 rounded-full bg-primary" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 二级分类筛选胶囊(横向滚动) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-8 -mt-4 py-1"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
          >
            {L2_CATEGORIES.map((name) => {
              const selected =
                name === '全部'
                  ? l2Selected.length === 0
                  : l2Selected.includes(name);
              return (
                <TouchableOpacity
                  key={name}
                  onPress={() => toggleL2(name)}
                  activeOpacity={0.7}
                  className={
                    selected
                      ? 'px-3 py-1 rounded-full bg-surface-container-high'
                      : 'px-3 py-1 rounded-full bg-surface-container'
                  }
                >
                  <Text
                    className={
                      selected
                        ? 'font-label-caps text-label-caps text-primary'
                        : 'font-label-caps text-label-caps text-on-surface-variant'
                    }
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 列表 / 空状态 / 加载 */}
          {loading && items.length === 0 ? (
            <View className="flex-1 items-center justify-center px-container-padding-mobile py-20">
              <ActivityIndicator size="large" color="#24389c" />
            </View>
          ) : items.length === 0 ? (
            <View className="flex-1 items-center justify-center px-container-padding-mobile py-20">
              <Text className="font-manrope text-xl font-semibold text-on-surface">
                {hasFilter ? '没有匹配的衣物' : '衣橱还是空的'}
              </Text>
              <Text className="mt-2 font-inter text-body-sm text-on-surface-variant">
                {hasFilter ? '试试调整筛选条件' : '点击右下角 + 录入第一件衣物'}
              </Text>
            </View>
          ) : (
            <MasonryGrid
              items={items}
              onPress={setPreviewItem}
              onLongPress={setPreviewItem}
            />
          )}

          {/* 底部留白,避免被 FAB / Tab 栏遮挡 */}
          <View className="h-40" />
        </ScrollView>
      </View>

      {/* 悬浮录入按钮(原型右下角 add FAB) */}
      <TouchableOpacity
        onPress={startCapture}
        activeOpacity={0.85}
        className="absolute right-6 w-14 h-14 rounded-full bg-primary items-center justify-center z-40"
        style={{
          bottom: 80 + insets.bottom + 16,
          elevation: 6,
          shadowColor: '#24389c',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
        }}
      >
        <MaterialIcons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* 预览弹窗 */}
      <PreviewModal
        item={previewItem}
        visible={!!previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </View>
  );
}
