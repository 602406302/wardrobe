// 底部选衣条:横向滑动浏览衣物,点击添加到画布
// UI 1:1 迁移自原型 _2/code.html(托盘第三层),className 原样复制,业务逻辑保留
import { memo, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { container, TOKENS } from '../../infra/di/container';
import type { IClothingRepository } from '../../domain/repositories/IClothingRepository';
import type { IAssetStore } from '../../domain/repositories/IAssetStore';
import type { Clothing } from '../../domain/entities/Clothing';

interface Props {
  onPick: (item: Clothing) => void;
}

export const ClothingPicker = memo(function ClothingPicker({ onPick }: Props) {
  const [items, setItems] = useState<Clothing[]>([]);
  const [uriCache, setUriCache] = useState<Record<string, string>>({});

  const clothingRepo = container.get<IClothingRepository>(TOKENS.IClothingRepository);
  const assetStore = container.get<IAssetStore>(TOKENS.IAssetStore);

  useEffect(() => {
    clothingRepo.list({ sortBy: 'createdAt', sortOrder: 'desc' }).then(async (list) => {
      setItems(list);
      const cache: Record<string, string> = {};
      for (const c of list) {
        const rel = c.imageThumbPath ?? c.imageLocalPath;
        cache[rel] = await assetStore.getPublicUrl(rel);
      }
      setUriCache(cache);
    });
  }, [clothingRepo, assetStore]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      {items.map((item) => {
        const rel = item.imageThumbPath ?? item.imageLocalPath;
        const uri = uriCache[rel];
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onPick(item)}
            activeOpacity={0.85}
            style={{ width: 80, height: 96, marginTop: 0, backgroundColor: '#e9e9f1', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(197,197,212,0.2)' }}
          >
            {uri ? (
              <Image
                source={{ uri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: '100%', height: '100%', backgroundColor: '#dcdce5' }} />
            )}
          </TouchableOpacity>
        );
      })}
      {items.length === 0 && (
        <Text style={{ fontSize: 13, color: '#757684' }}>暂无衣物</Text>
      )}
    </ScrollView>
  );
});
