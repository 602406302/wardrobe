// 筛选栏:横向滚动标签 Chip(品类 + 颜色)
import { memo, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { container, TOKENS } from '../../infra/di/container';
import type { ITagRepository } from '../../domain/repositories/ITagRepository';
import type { Tag } from '../../domain/entities/Tag';
import { useWardrobeStore } from './wardrobeStore';

interface Props {
  onCollapse?: () => void;
}

export const FilterBar = memo(function FilterBar({ onCollapse }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [expanded, setExpanded] = useState(false);
  const selectedTagIds = useWardrobeStore((s) => s.selectedTagIds);
  const toggleTag = useWardrobeStore((s) => s.toggleTag);
  const clearFilters = useWardrobeStore((s) => s.clearFilters);
  const refresh = useWardrobeStore((s) => s.refresh);

  useEffect(() => {
    const tagRepo = container.get<ITagRepository>(TOKENS.ITagRepository);
    tagRepo.list().then(setTags).catch(() => {});
  }, []);

  const l1Tags = tags.filter((t) => t.type === 'category_l1');
  const l2Tags = tags.filter((t) => t.type === 'category_l2');
  const colorTags = tags.filter((t) => t.type === 'color');

  const handleToggle = (id: string) => {
    toggleTag(id);
    setTimeout(refresh, 0);
  };

  const handleClear = () => {
    clearFilters();
    setTimeout(refresh, 0);
  };

  return (
    <View className="border-b border-outline bg-surface">
      {/* 折叠/展开切换 */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <Text className="font-manrope text-sm font-semibold text-on-surface">
          筛选{selectedTagIds.length > 0 ? ` · ${selectedTagIds.length}` : ''}
        </Text>
        <View className="flex-row items-center gap-3">
          {selectedTagIds.length > 0 && (
            <Pressable onPress={handleClear}>
              <Text className="font-inter text-xs text-primary">清除</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setExpanded((e) => !e)}>
            <Text className="font-inter text-xs text-on-surface-variant">
              {expanded ? '收起' : '展开'}
            </Text>
          </Pressable>
        </View>
      </View>

      {expanded && (
        <ScrollView className="max-h-64" contentContainerClassName="px-5 pb-3">
          {/* 品类 */}
          <Text className="pt-1 font-inter text-xs text-on-surface-variant">品类</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-2">
            {l1Tags.map((t) => (
              <Chip key={t.id} label={t.name} selected={selectedTagIds.includes(t.id)} onPress={() => handleToggle(t.id)} />
            ))}
            {l2Tags.map((t) => (
              <Chip key={t.id} label={t.name} selected={selectedTagIds.includes(t.id)} onPress={() => handleToggle(t.id)} />
            ))}
          </View>

          {/* 颜色 */}
          <Text className="pt-3 font-inter text-xs text-on-surface-variant">颜色</Text>
          <View className="mt-1.5 flex-row flex-wrap gap-2">
            {colorTags.map((t) => (
              <Chip key={t.id} label={t.name} selected={selectedTagIds.includes(t.id)} onPress={() => handleToggle(t.id)} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
});

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      className={`rounded-full px-3 py-1.5 ${selected ? 'bg-primary' : 'bg-surface-variant'}`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className={`font-inter text-xs ${selected ? 'text-white' : 'text-on-surface'}`}>{label}</Text>
    </TouchableOpacity>
  );
}
