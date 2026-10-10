import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { initBindings } from '../infra/di/bindings';
import { RootStack } from './navigation/RootStack';
import { ErrorBoundary } from './ErrorBoundary';

initBindings();

// 全局未捕获异常处理:把致命错误显示出来而非闪退
const originalHandler = ErrorUtils.getGlobalHandler?.();
ErrorUtils.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
  console.error('FATAL:', isFatal, error?.message, error?.stack);
  if (originalHandler) originalHandler(error, isFatal);
});

export function RootApp() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
