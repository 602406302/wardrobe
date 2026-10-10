import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { RootTabs } from './Tabs';
import { CaptureCameraScreen } from '../../features/capture/CaptureCameraScreen';
import { CaptureCropScreen } from '../../features/capture/CaptureCropScreen';
import { CaptureTagsScreen } from '../../features/capture/CaptureTagsScreen';
import { OutfitCanvasScreen } from '../../features/outfit/OutfitCanvasScreen';
import { TagManageScreen } from '../../features/profile/TagManageScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontFamily: 'Manrope', fontWeight: '600' },
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#f9f9fc' },
        headerTintColor: '#24389c',
      }}
    >
      <Stack.Screen name="Tabs" component={RootTabs} options={{ headerShown: false }} />
      <Stack.Screen name="CaptureCamera" component={CaptureCameraScreen} options={{ title: '添加衣物' }} />
      <Stack.Screen name="CaptureCrop" component={CaptureCropScreen} options={{ title: '裁剪调整' }} />
      <Stack.Screen name="CaptureTags" component={CaptureTagsScreen} options={{ title: '选择标签' }} />
      <Stack.Screen name="OutfitCanvas" component={OutfitCanvasScreen} options={{ title: '搭配画布' }} />
      <Stack.Screen name="TagManage" component={TagManageScreen} options={{ title: '标签管理' }} />
    </Stack.Navigator>
  );
}
