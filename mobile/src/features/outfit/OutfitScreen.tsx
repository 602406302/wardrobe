// 搭配列表页:历史搭配 + 新建入口
// UI 1:1 迁移自原型 _6/code.html,className 原样复制,业务逻辑保留
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../app/navigation/types';
import { container, TOKENS } from '../../infra/di/container';
import type { IOutfitRepository } from '../../domain/repositories/IOutfitRepository';
import type { IAssetStore } from '../../domain/repositories/IAssetStore';
import type { Outfit } from '../../domain/entities/Outfit';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const SCENES = ['全部搭配', '职场通勤', '休闲周末', '节日聚会'];

const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = 20;
const GAP = 16;
const MIN_CARD = 160;
// 近似 CSS grid auto-fill minmax(160px, 1fr):手机 2 列,平板更多
const NUM_COLS = Math.max(2, Math.floor((SCREEN_WIDTH - H_PADDING * 2 + GAP) / (MIN_CARD + GAP)));

export function OutfitScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [coverUris, setCoverUris] = useState<Record<string, string>>({});
  const [activeScene, setActiveScene] = useState(0);

  const outfitRepo = container.get<IOutfitRepository>(TOKENS.IOutfitRepository);
  const assetStore = container.get<IAssetStore>(TOKENS.IAssetStore);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await outfitRepo.list();
      setItems(list);
      // 加载封面图 URI
      const uriMap: Record<string, string> = {};
      for (const o of list) {
        if (o.coverPath) {
          uriMap[o.id] = await assetStore.getPublicUrl(o.coverPath);
        }
      }
      setCoverUris(uriMap);
    } finally {
      setLoading(false);
    }
  }, [outfitRepo, assetStore]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const createNew = () => navigation.navigate('OutfitCanvas', {});

  const openEdit = (item: Outfit) => navigation.navigate('OutfitCanvas', { editingId: item.id });

  const handleDelete = (item: Outfit) => {
    Alert.alert('删除搭配', `确定删除「${item.name}」?`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await outfitRepo.softDelete(item.id);
          load();
        },
      },
    ]);
  };

  const headerHeight = insets.top + 64;

  return (
    <View className="flex-1 bg-surface">
      {/* ============ 顶部导航栏(固定 · 毛玻璃近似) ============ */}
      <View className="absolute top-0 left-0 right-0 z-10">
        <View
          className="bg-surface/70 border-b border-outline-variant/30"
          style={{ marginTop: 0 }}
        >
          <View
            className="h-16 flex-row items-center gap-2 px-container-padding-mobile"
            style={{ marginTop: insets.top }}
          >
            <MaterialIcons name="palette" size={18} color="#24389c" />
            <Text className="font-display-lg text-title-md text-primary tracking-tight">
              衣搭 Wardrobe Palette
            </Text>
          </View>
        </View>
      </View>

      {/* ============ 可滚动内容区 ============ */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: H_PADDING,
          paddingTop: headerHeight + 16,
          paddingBottom: 128,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            colors={['#24389c']}
            tintColor="#24389c"
            progressViewOffset={headerHeight}
          />
        }
      >
        {/* -------- Hero 新建搭配区域 -------- */}
        <View className="mb-stack-lg relative overflow-hidden rounded-3xl bg-surface-container-highest">
          <View className="p-8">
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2">
              开启新的灵感
            </Text>
            <Text className="font-body-lg text-on-surface-variant">
              将您的单品自由组合，打造属于今天的独特风格。
            </Text>
            <TouchableOpacity
              onPress={createNew}
              activeOpacity={0.85}
              className="mt-6 flex-row items-center justify-center gap-2 bg-primary rounded-full px-8 py-4 w-fit"
              style={{ alignSelf: 'flex-start' }}
            >
              <MaterialIcons name="add" size={20} color="#ffffff" />
              <Text className="font-title-md text-on-primary">新建搭配</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* -------- 场景筛选胶囊栏 -------- */}
        <View className="mb-stack-md">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4, paddingRight: H_PADDING, gap: 8 }}
          >
            {SCENES.map((scene, i) => {
              const selected = activeScene === i;
              return (
                <TouchableOpacity
                  key={scene}
                  onPress={() => setActiveScene(i)}
                  activeOpacity={0.7}
                  className={
                    selected
                      ? 'px-6 py-2 rounded-full bg-primary-container whitespace-nowrap'
                      : 'px-6 py-2 rounded-full bg-surface-container whitespace-nowrap'
                  }
                >
                  <Text
                    className={
                      selected
                        ? 'font-title-md text-on-primary'
                        : 'font-title-md text-on-surface-variant'
                    }
                  >
                    {scene}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* -------- 搭配列表 -------- */}
        {loading && items.length === 0 ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#24389c" />
          </View>
        ) : items.length === 0 ? (
          <View className="items-center justify-center py-20">
            <MaterialIcons name="auto-awesome" size={48} color="#c5c5d4" />
            <Text className="mt-4 font-manrope text-xl font-semibold text-on-surface">
              还没有搭配
            </Text>
            <Text className="mt-2 font-inter text-body-sm text-on-surface-variant text-center">
              点击上方「新建搭配」开启你的第一套灵感
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap" style={{ marginHorizontal: -GAP / 2 }}>
            {items.map((item) => (
              <View
                key={item.id}
                style={{ width: `${100 / NUM_COLS}%`, paddingHorizontal: GAP / 2, paddingBottom: GAP }}
              >
                <OutfitCard
                  item={item}
                  coverUri={coverUris[item.id]}
                  onPress={() => openEdit(item)}
                  onLongPress={() => handleDelete(item)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============ 搭配卡片 ============
function OutfitCard({
  item,
  coverUri,
  onPress,
  onLongPress,
}: {
  item: Outfit;
  coverUri?: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      {({ pressed }) => (
        <View style={{ transform: pressed ? [{ scale: 0.96 }] : undefined }}>
          {/* 图片区 */}
          <View className="aspect-[3/4] relative bg-surface-container rounded-2xl overflow-hidden mb-3 border border-outline-variant/30">
            {coverUri ? (
              <Image
                source={{ uri: coverUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <MaterialIcons name="auto-awesome" size={32} color="#c5c5d4" />
                <Text className="mt-1 font-inter text-xs text-on-surface-variant">无封面</Text>
              </View>
            )}
          </View>
          {/* 文字区 */}
          <Text className="font-title-md text-on-surface mb-1" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="font-body-sm text-on-surface-variant" numberOfLines={1}>
            {item.note || `${item.canvasData.length} 件 · ${formatDate(item.updatedAt)}`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
