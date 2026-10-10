// 录入流程导航参数类型
export type RootStackParamList = {
  Tabs: undefined;
  // 拍照/选图页:无入参
  CaptureCamera: undefined;
  // 裁剪页:接收待裁剪图片 URI 数组
  CaptureCrop: { uris: string[] };
  // 标签选择页:接收裁剪后的图片 URI 数组
  CaptureTags: { uris: string[] };
  // 搭配画布页:editingId 为空表示新建,有值表示编辑现有搭配
  OutfitCanvas: { editingId?: string };
  // 标签管理页
  TagManage: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
