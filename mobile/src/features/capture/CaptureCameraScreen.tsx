// 录入流程:拍照/选图页
// 入口:衣橱页悬浮 [+] → 跳转本页
// 产出:图片 URI 数组 → 传给裁剪页
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';

const MAX_IMAGES = 9;

type Props = NativeStackScreenProps<RootStackParamList, 'CaptureCamera'>;

export function CaptureCameraScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);

  const pickFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('权限不足', '需要相机权限才能拍照');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setSelected((prev) => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES));
    }
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('权限不足', '需要相册权限才能选图');
      return;
    }
    const remaining = MAX_IMAGES - selected.length;
    if (remaining <= 0) {
      Alert.alert('已达上限', `单次最多 ${MAX_IMAGES} 张`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.9,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setSelected((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
    }
  }, [selected.length]);

  const removeAt = (index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const goCrop = () => {
    if (selected.length === 0) {
      Alert.alert('请先添加图片');
      return;
    }
    navigation.navigate('CaptureCrop', { uris: selected });
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* 操作按钮区 */}
      <View className="flex-row gap-3 px-5 pt-4">
        <TouchableOpacity
          className="flex-1 items-center rounded-2xl bg-primary py-6"
          onPress={pickFromCamera}
          activeOpacity={0.85}
        >
          <Text className="font-manrope text-base font-semibold text-white">拍照</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 items-center rounded-2xl bg-surface-variant py-6"
          onPress={pickFromLibrary}
          activeOpacity={0.85}
        >
          <Text className="font-manrope text-base font-semibold text-on-surface">从相册选择</Text>
        </TouchableOpacity>
      </View>

      {/* 引导提示 */}
      <View className="mx-5 mt-4 rounded-xl bg-surface-variant/60 px-4 py-3">
        <Text className="font-inter text-xs leading-5 text-on-surface-variant">
          建议在纯色(白色)背景下拍摄,后续预览效果更好。单次最多 {MAX_IMAGES} 张。
        </Text>
      </View>

      {/* 已选图片预览 */}
      <Text className="px-5 pt-5 font-manrope text-sm font-semibold text-on-surface">
        已选 {selected.length}/{MAX_IMAGES}
      </Text>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-3">
        <View className="flex-row flex-wrap gap-3">
          {selected.map((uri, i) => (
            <View key={i} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeAt(i)}
                activeOpacity={0.7}
              >
                <Text className="text-white">✕</Text>
              </TouchableOpacity>
              <View style={styles.indexBadge}>
                <Text className="text-white">{i + 1}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 底部下一步 */}
      <View className="border-t border-outline px-5 py-4">
        <TouchableOpacity
          className={`items-center rounded-2xl py-4 ${selected.length > 0 ? 'bg-primary' : 'bg-surface-variant'}`}
          onPress={goCrop}
          activeOpacity={0.85}
        >
          <Text
            className={`font-manrope text-base font-semibold ${selected.length > 0 ? 'text-white' : 'text-on-surface-variant'}`}
          >
            下一步:裁剪
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thumbWrap: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(36,56,156,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
