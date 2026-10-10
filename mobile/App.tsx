// 完整应用:polyfill + NativeWind + DI + 导航
import 'react-native-get-random-values';
import './global.css';
import './src/infra/di/bindings';
import { RootApp } from './src/app/RootApp';

export default function App() {
  return <RootApp />;
}
