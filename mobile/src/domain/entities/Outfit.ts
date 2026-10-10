// 画布上每件衣物的摆放信息
export interface OutfitItemPlacement {
  clothingId: string;
  x: number;                     // 画布坐标(0~1 归一化)
  y: number;
  scale: number;
  rotation: number;              // 弧度
  zIndex: number;
}

export interface Outfit {
  id: string;
  name: string;
  note: string | null;
  coverPath: string | null;      // 画布导出的封面图相对路径
  canvasData: OutfitItemPlacement[];
  // 同步字段
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
  ownerId: string;
}

export interface OutfitInput {
  name: string;
  note?: string | null;
  coverPath?: string | null;
  canvasData: OutfitItemPlacement[];
}
