// 全局错误边界:捕获渲染错误并显示在屏幕上(而非闪退)
import { Component, type ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#ff6b6b', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            应用出错
          </Text>
          <ScrollView style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 13, lineHeight: 18 }}>
              {this.state.error?.message ?? '未知错误'}
            </Text>
            <Text style={{ color: '#888', fontSize: 11, marginTop: 16, lineHeight: 16 }}>
              {this.state.error?.stack}
            </Text>
          </ScrollView>
          <TouchableOpacity
            onPress={this.reset}
            style={{
              backgroundColor: '#24389c',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>重试</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
