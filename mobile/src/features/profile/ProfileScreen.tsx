// 个人中心:统计 + 标签管理 + 主题 + 备份 + 账号
// UI 1:1 迁移自原型 _3/code.html,className 原样复制,业务逻辑保留
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { container, TOKENS } from '../../infra/di/container';
import type { IAuth } from '../../domain/repositories/IAuth';
import type { User } from '../../domain/entities/User';
import { useThemeStore } from '../../shared/theme/themeStore';
import { getStats, type Stats } from './statsService';
import { exportBackup, importBackup } from './backupService';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const themeMode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const auth = container.get<IAuth>(TOKENS.IAuth);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([getStats(), auth.currentUser()]);
      setStats(s);
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert('导出失败', e instanceof Error ? e.message : '');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: 'application/json' });
      if (result.canceled || !result.assets?.[0]) return;
      Alert.alert('导入数据', '将覆盖当前数据,确定继续?', [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await importBackup(result.assets[0].uri);
              Alert.alert('导入成功', '', [{ text: '好的', onPress: load }]);
            } catch (e) {
              Alert.alert('导入失败', e instanceof Error ? e.message : '');
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert('选文件失败', e instanceof Error ? e.message : '');
    }
  };

  // 存储数据管理:导出 / 导入 二选一
  const handleDataManage = () => {
    Alert.alert('存储数据管理', '选择操作', [
      { text: '导出备份', onPress: handleExport },
      { text: '导入备份', onPress: handleImport },
      { text: '取消', style: 'cancel' },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#24389c" />
      </View>
    );
  }

  const categories = stats?.byCategoryL1 ?? [];
  const userName = user?.displayName ?? '本地用户';

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 64 + 16, paddingBottom: 128 }}
      >
        {/* Profile Header */}
        <View className="flex-row items-center gap-gutter mb-stack-lg">
          <View className="w-20 h-20 rounded-full border-2 border-primary-container/30 p-1 items-center justify-center">
            <View className="w-full h-full rounded-full bg-primary items-center justify-center">
              <Text className="font-manrope text-2xl font-semibold text-on-primary">
                {userName[0]}
              </Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {userName}
            </Text>
            <Text className="font-body-sm text-body-sm text-on-surface-variant italic">
              “精简衣橱，灵感生活”
            </Text>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View className="mb-stack-lg">
          {/* 顶部大卡片 col-span-2 */}
          <Pressable className="flex-row items-center justify-between bg-primary-container/10 rounded-xl border border-outline-variant/20 p-6 active:scale-95">
            <View>
              <Text className="font-label-caps text-label-caps text-primary uppercase mb-1">
                总衣物清单
              </Text>
              <View className="flex-row items-baseline gap-1">
                <Text className="font-display-lg text-headline-lg text-on-surface">
                  {stats?.totalClothings ?? 0}
                </Text>
                <Text className="font-title-md text-on-surface-variant opacity-60">件</Text>
              </View>
            </View>
            <MaterialIcons name="checkroom" size={36} color="#24389c66" />
          </Pressable>

          {/* 品类分布小卡片 2x2 */}
          {categories.length > 0
            ? Array.from({ length: Math.ceil(categories.length / 2) }).map((_, rowIdx) => {
                const pair = categories.slice(rowIdx * 2, rowIdx * 2 + 2);
                return (
                  <View key={rowIdx} className="flex-row gap-4 mt-4">
                    {pair.map((item) => (
                      <View key={item.tag.id} className="flex-1">
                        <View className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-5">
                          <Text className="font-label-caps text-label-caps text-on-surface-variant mb-1">
                            {item.tag.name}
                          </Text>
                          <View className="flex-row items-baseline gap-1">
                            <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                              {item.count}
                            </Text>
                            <Text className="font-body-sm text-on-surface-variant">件</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                    {pair.length === 1 ? <View className="flex-1" /> : null}
                  </View>
                );
              })
            : null}
        </View>

        {/* Menu List Group */}
        <View>
          {/* 主菜单卡片 */}
          <View className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <MenuRow
              icon="sell"
              iconColor="#52625b"
              label="标签管理"
              onPress={() => navigation.navigate('TagManage')}
            />
            <MenuRow
              icon="palette"
              iconColor="#52625b"
              label="基础主题设置"
              value={themeMode === 'light' ? '浅色' : '深色'}
              onPress={toggleTheme}
            />
            <MenuRow
              icon="storage"
              iconColor="#52625b"
              label="存储数据管理"
              badge={exporting ? '导出中...' : '本地保存'}
              onPress={handleDataManage}
              disabled={exporting}
              last
            />
          </View>

          {/* 关于卡片 */}
          <View className="mt-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <MenuRow
              icon="info"
              iconColor="#52625b"
              label="关于 衣搭"
              value="v1.0.0"
              last
            />
          </View>
        </View>
      </ScrollView>

      {/* 固定顶部导航栏(避开状态栏) */}
      <View
        className="absolute left-0 right-0 z-50 h-16 bg-surface/70 border-b border-outline-variant/30 justify-center px-container-padding-mobile"
        style={{ top: insets.top }}
      >
        <Text className="font-display-lg text-title-md text-primary tracking-tight">
          衣搭 Wardrobe Palette
        </Text>
      </View>
    </View>
  );
}

// ============ 子组件 ============
function MenuRow({
  icon,
  iconColor,
  label,
  value,
  badge,
  onPress,
  disabled,
  last,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
  disabled?: boolean;
  last?: boolean;
}) {
  const content = (
    <View
      className={`flex-row items-center justify-between px-6 py-5 ${last ? '' : 'border-b border-outline-variant/10'}`}
    >
      <View className="flex-row items-center gap-4">
        <MaterialIcons name={icon} size={24} color={iconColor} />
        <Text className="font-title-md text-on-surface">{label}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {badge ? (
          <View className="bg-secondary-container px-2 py-0.5 rounded-full">
            <Text className="font-body-sm text-on-surface-variant">{badge}</Text>
          </View>
        ) : null}
        {value ? (
          <Text className="font-body-sm text-outline-variant">{value}</Text>
        ) : null}
        {onPress ? (
          <MaterialIcons name="chevron-right" size={20} color="#c5c5d4" />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} disabled={disabled} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}
