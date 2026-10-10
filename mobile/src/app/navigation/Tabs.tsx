// 底部Tab导航:半透明毛玻璃风格 + MaterialIcons + 激活态胶囊高亮
// UI 1:1 迁移自原型 _5/code.html 底部导航栏
// 注意:避免使用 NativeWind 的 flex 类(会映射成 flex:1 压扁内容),改用纯 inline style
import type { ComponentProps } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WardrobeScreen } from '../../features/wardrobe/WardrobeScreen';
import { OutfitScreen } from '../../features/outfit/OutfitScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const Tab = createBottomTabNavigator();

const PRIMARY = '#24389c';
const INACTIVE = '#454652';
const ACTIVE_BG = 'rgba(36, 56, 156, 0.20)';

// 自定义Tab图标:1:1 迁移 demo 的 <a> 标签结构
// 激活态: bg-primary-container/20 rounded-full px-4 py-1 scale-105 + font-bold + mt-0.5
// 非激活态: mt-1 无背景
function TabIcon({
  name,
  label,
  color,
  focused,
}: {
  name: IconName;
  label: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      style={[
        styles.tabItem,
        focused
          ? { backgroundColor: ACTIVE_BG, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 4, transform: [{ scale: 1.05 }] }
          : { paddingHorizontal: 16, paddingVertical: 4 },
      ]}
    >
      <MaterialIcons name={name} size={24} color={color} />
      <Text
        style={[
          styles.tabLabel,
          { color, fontWeight: focused ? 'bold' : '500', marginTop: focused ? 2 : 4 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

export function RootTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          height: 80 + insets.bottom,
          backgroundColor:
            Platform.OS === 'ios'
              ? 'rgba(249, 249, 252, 0.7)'
              : 'rgba(249, 249, 252, 0.95)',
          borderTopColor: 'rgba(197, 197, 212, 0.2)',
          borderTopWidth: 1,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarShowLabel: false,
        tabBarIconStyle: { width: '100%', height: '100%' },
        tabBarItemStyle: { paddingVertical: 0, height: 64 },
      }}
    >
      <Tab.Screen
        name="Wardrobe"
        component={WardrobeScreen}
        options={{
          title: '衣橱',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="checkroom" label="衣橱" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Outfit"
        component={OutfitScreen}
        options={{
          title: '搭配',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="auto-awesome" label="搭配" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" label="我的" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
