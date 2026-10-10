// 标签管理页:自定义标签的新增/删除,标签排序
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import { container, TOKENS } from '../../infra/di/container';
import type { ITagRepository } from '../../domain/repositories/ITagRepository';
import type { Tag } from '../../domain/entities/Tag';

export function TagManageScreen() {
  const [customTags, setCustomTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const tagRepo = container.get<ITagRepository>(TOKENS.ITagRepository);

  const load = useCallback(async () => {
    const all = await tagRepo.list();
    setAllTags(all);
    setCustomTags(all.filter((t) => t.type === 'custom'));
  }, [tagRepo]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await tagRepo.create({ type: 'custom', name: trimmed });
    setNewName('');
    setShowAdd(false);
    load();
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert('删除标签', `确定删除「${tag.name}」?已关联此标签的衣物不受影响。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await tagRepo.softDelete(tag.id);
          load();
        },
      },
    ]);
  };

  // 上移/下移排序
  const handleMove = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= customTags.length) return;
    const reordered = [...customTags];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setCustomTags(reordered);
    await tagRepo.reorder(reordered.map((t) => t.id));
  };

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={customTags}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="font-manrope text-sm font-semibold text-on-surface">自定义标签</Text>
            <TouchableOpacity onPress={() => setShowAdd(true)} activeOpacity={0.7}>
              <Text className="font-inter text-sm text-primary">+ 新增</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="font-inter text-sm text-on-surface-variant">暂无自定义标签</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View className="mx-5 mb-2 flex-row items-center justify-between rounded-xl bg-surface-variant px-4 py-3">
            <Text className="font-inter text-sm text-on-surface">{item.name}</Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={() => handleMove(index, -1)} disabled={index === 0}>
                <Text className={`text-base ${index === 0 ? 'text-outline' : 'text-primary'}`}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleMove(index, 1)} disabled={index === customTags.length - 1}>
                <Text className={`text-base ${index === customTags.length - 1 ? 'text-outline' : 'text-primary'}`}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text className="text-base text-red-500">删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <View className="flex-1 items-center justify-center bg-black/40 px-8">
          <View className="w-full rounded-2xl bg-white p-5">
            <Text className="font-manrope text-base font-semibold text-on-surface">新增自定义标签</Text>
            <TextInput
              className="mt-3 rounded-xl border border-outline px-4 py-3 font-inter text-sm"
              placeholder="标签名称"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 items-center rounded-xl bg-surface-variant py-3"
                onPress={() => setShowAdd(false)}
              >
                <Text className="font-manrope text-sm font-semibold text-on-surface">取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 items-center rounded-xl bg-primary py-3"
                onPress={handleAdd}
              >
                <Text className="font-manrope text-sm font-semibold text-white">添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
