// 衣物卡片:竖向比例缩略图 + 悬浮操作按钮,长按预览,点击详情
// UI 1:1 迁移自原型 _5/code.html 的瀑布流卡片
import { memo, useEffect, useState } from 'react';
import { View, TouchableOpacity, Image, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Clothing } from '../../domain/entities/Clothing';
import { useWardrobeStore } from './wardrobeStore';

interface Props {
  item: Clothing;
  onPress: (item: Clothing) => void;
  onLongPress: (item: Clothing) => void;
}

export const ClothingCard = memo(function ClothingCard({ item, onPress, onLongPress }: Props) {
  const getUri = useWardrobeStore((s) => s.getUri);
  const [uri, setUri] = useState<string>('');

  // 优先用缩略图,没有则用原图
  const relPath = item.imageThumbPath ?? item.imageLocalPath;

  useEffect(() => {
    let mounted = true;
    getUri(relPath).then((u) => mounted && setUri(u));
    return () => {
      mounted = false;
    };
  }, [relPath, getUri]);

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress(item);
  };

  return (
    <Pressable
      onPress={() => onPress(item)}
      onLongPress={handleLongPress}
      delayLongPress={400}
      className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-container border border-outline-variant/20"
    >
      {uri ? (
        <Image
          source={{ uri }}
          className="absolute top-0 left-0 right-0 bottom-0"
          resizeMode="cover"
        />
      ) : (
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-surface-container-highest" />
      )}
      {/* 右下角悬浮操作按钮(毛玻璃近似) */}
      <TouchableOpacity
        onPress={() => onPress(item)}
        activeOpacity={0.8}
        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-surface/90 border border-outline-variant/20 items-center justify-center"
      >
        <MaterialIcons name="edit" size={20} color="#24389c" />
      </TouchableOpacity>
    </Pressable>
  );
});
