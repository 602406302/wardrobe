// 预览弹窗:长按触发,大图 + 名称 + 备注 + 标签
import { memo, useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { container, TOKENS } from '../../infra/di/container';
import type { IClothingRepository } from '../../domain/repositories/IClothingRepository';
import type { ITagRepository } from '../../domain/repositories/ITagRepository';
import type { Clothing } from '../../domain/entities/Clothing';
import type { Tag } from '../../domain/entities/Tag';
import { useWardrobeStore } from './wardrobeStore';

interface Props {
  item: Clothing | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (item: Clothing) => void;
}

export const PreviewModal = memo(function PreviewModal({ item, visible, onClose, onEdit }: Props) {
  const getUri = useWardrobeStore((s) => s.getUri);
  const [uri, setUri] = useState('');
  const [tagNames, setTagNames] = useState<string[]>([]);

  useEffect(() => {
    if (!item) return;
    getUri(item.imageLocalPath).then(setUri);
    const clothingRepo = container.get<IClothingRepository>(TOKENS.IClothingRepository);
    const tagRepo = container.get<ITagRepository>(TOKENS.ITagRepository);
    clothingRepo.getTagIds(item.id).then(async (ids) => {
      const allTags = await tagRepo.list();
      const names = allTags.filter((t) => ids.includes(t.id)).map((t) => t.name);
      setTagNames(names);
    });
  }, [item, getUri]);

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 px-5 py-10">
        <View className="flex-1 items-center justify-center">
          <View className="max-h-full w-full overflow-hidden rounded-2xl bg-white">
            {/* 大图 */}
            {uri ? (
              <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="contain" />
            ) : null}

            {/* 信息 */}
            <ScrollView className="px-5 py-4">
              {item.name ? (
                <Text className="font-manrope text-lg font-semibold text-on-surface">{item.name}</Text>
              ) : null}
              {item.note ? (
                <Text className="mt-1 font-inter text-sm text-on-surface-variant">{item.note}</Text>
              ) : null}
              {tagNames.length > 0 ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {tagNames.map((name, i) => (
                    <View key={i} className="rounded-full bg-surface-variant px-3 py-1">
                      <Text className="font-inter text-xs text-on-surface">{name}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            {/* 操作按钮 */}
            <View className="flex-row gap-3 border-t border-outline px-5 py-3">
              <TouchableOpacity
                className="flex-1 items-center rounded-xl bg-surface-variant py-3"
                onPress={onClose}
              >
                <Text className="font-manrope text-sm font-semibold text-on-surface">关闭</Text>
              </TouchableOpacity>
              {onEdit && (
                <TouchableOpacity
                  className="flex-1 items-center rounded-xl bg-primary py-3"
                  onPress={() => onEdit(item)}
                >
                  <Text className="font-manrope text-sm font-semibold text-white">编辑</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
});
