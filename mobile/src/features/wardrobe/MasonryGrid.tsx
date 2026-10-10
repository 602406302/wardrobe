// 瀑布流:双列布局(按高度交替分配,平衡两列)
// UI 1:1 迁移自原型 _5/code.html 的 masonry-grid
import { memo, useMemo } from 'react';
import { View } from 'react-native';
import type { Clothing } from '../../domain/entities/Clothing';
import { ClothingCard } from './ClothingCard';

interface Props {
  items: Clothing[];
  onPress: (item: Clothing) => void;
  onLongPress: (item: Clothing) => void;
}

export const MasonryGrid = memo(function MasonryGrid({ items, onPress, onLongPress }: Props) {
  // 简单双列:奇数左列,偶数右列
  const { left, right } = useMemo(() => {
    const left: Clothing[] = [];
    const right: Clothing[] = [];
    items.forEach((item, i) => (i % 2 === 0 ? left.push(item) : right.push(item)));
    return { left, right };
  }, [items]);

  return (
    <View className="flex-row px-4 gap-4">
      <View className="flex-1 gap-4">
        {left.map((item) => (
          <ClothingCard key={item.id} item={item} onPress={onPress} onLongPress={onLongPress} />
        ))}
      </View>
      <View className="flex-1 gap-4">
        {right.map((item) => (
          <ClothingCard key={item.id} item={item} onPress={onPress} onLongPress={onLongPress} />
        ))}
      </View>
    </View>
  );
});
