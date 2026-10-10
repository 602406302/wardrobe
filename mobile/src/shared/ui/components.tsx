// 共享UI组件库:毛玻璃容器、胶囊按钮、图标符号、分段控制
// 所有屏幕共用,确保视觉一致性
import { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';

// ============ 毛玻璃容器 ============
// RN 无原生 backdrop-filter,用半透明背景近似
export function GlassPanel({
  children,
  style,
  intensity = 70,
}: {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
}) {
  const opacity = intensity / 100;
  return (
    <View
      style={[
        styles.glass,
        { backgroundColor: `rgba(249, 249, 252, ${opacity})` },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ============ 胶囊按钮 ============
export function PillButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'container';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  style?: ViewStyle;
}) {
  const variantStyle =
    variant === 'primary'
      ? styles.pillPrimary
      : variant === 'outline'
      ? styles.pillOutline
      : variant === 'container'
      ? styles.pillContainer
      : styles.pillGhost;

  const sizeStyle =
    size === 'sm' ? styles.pillSm : size === 'lg' ? styles.pillLg : styles.pillMd;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.pillBase, variantStyle, sizeStyle, style]}
    >
      {icon ? <Text style={styles.pillIcon}>{icon}</Text> : null}
      <Text
        style={[
          styles.pillText,
          variant === 'primary' && styles.pillTextOnPrimary,
          variant === 'container' && styles.pillTextPrimary,
          variant === 'outline' && styles.pillTextSurface,
          variant === 'ghost' && styles.pillTextPrimary,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============ 图标符号(用 Unicode/emoji 近似 Material Symbols) ============
// 避免引入额外图标库依赖,用文本符号实现
export const Icon = {
  // 导航
  back: '←',
  close: '✕',
  chevronRight: '›',
  chevronDown: '⌄',
  // 操作
  add: '+',
  edit: '✎',
  delete: '🗑',
  search: '⌕',
  filter: '☰',
  share: '↗',
  rotate: '⟳',
  reset: '↺',
  save: '💾',
  // 衣物相关
  shirt: '👕',
  pants: '👖',
  shoes: '👟',
  dress: '👗',
  accessory: '👒',
  // 分类
  wardrobe: '🚪',
  outfit: '🎨',
  profile: '👤',
  // 状态
  check: '✓',
  palette: '🎨',
  tag: '🏷',
  database: '💾',
  info: 'ℹ',
  // 季节/场景
  work: '💼',
  weekend: '☕',
  party: '🎉',
};

// ============ 分段控制(用于一级分类切换) ============
export function SegmentedTabs({
  tabs,
  activeIndex,
  onChange,
}: {
  tabs: string[];
  activeIndex: number;
  onChange: (i: number) => void;
}) {
  return (
    <View style={styles.segmentedWrap}>
      {tabs.map((tab, i) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(i)}
          style={styles.segmentedItem}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentedText,
              i === activeIndex && styles.segmentedTextActive,
            ]}
          >
            {tab}
          </Text>
          {i === activeIndex ? <View style={styles.segmentedDot} /> : null}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============ 筛选胶囊 ============
export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chipBase, selected ? styles.chipSelected : styles.chipDefault]}
    >
      <Text
        style={[
          styles.chipText,
          selected ? styles.chipTextSelected : styles.chipTextDefault,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  glass: {
    // iOS 毛玻璃,Android 用半透明背景
    ...(Platform.OS === 'ios'
      ? { backgroundColor: 'rgba(249, 249, 252, 0.7)' }
      : { backgroundColor: 'rgba(249, 249, 252, 0.92)' }),
  },
  // ============ Pill ============
  pillBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    gap: 8,
  },
  pillPrimary: {
    backgroundColor: '#24389c',
  },
  pillContainer: {
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(63, 81, 181, 0.2)',
  },
  pillOutline: {
    borderWidth: 1,
    borderColor: '#c5c5d4',
    backgroundColor: 'transparent',
  },
  pillGhost: {
    backgroundColor: 'transparent',
  },
  pillSm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillMd: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pillLg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  pillText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillTextOnPrimary: {
    color: '#ffffff',
  },
  pillTextPrimary: {
    color: '#24389c',
  },
  pillTextSurface: {
    color: '#1a1c1e',
  },
  pillIcon: {
    fontSize: 14,
    color: '#ffffff',
  },
  // ============ Segmented ============
  segmentedWrap: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 24,
  },
  segmentedItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  segmentedText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#454652',
  },
  segmentedTextActive: {
    color: '#24389c',
    fontWeight: '700',
  },
  segmentedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#24389c',
    marginTop: 4,
  },
  // ============ Chip ============
  chipBase: {
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  chipDefault: {
    backgroundColor: '#eeeef0',
  },
  chipSelected: {
    backgroundColor: '#e8e8ea',
  },
  chipText: {
    fontFamily: 'Inter',
    fontSize: 14,
  },
  chipTextDefault: {
    color: '#454652',
  },
  chipTextSelected: {
    color: '#24389c',
    fontWeight: '500',
  },
});
