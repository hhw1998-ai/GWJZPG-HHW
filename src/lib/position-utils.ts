/**
 * 通用岗位职级识别
 * 基于关键词模糊匹配，不硬编码具体公司/岗位名
 *
 * @param name 岗位名称
 * @returns 职级数字（0=高层, 1=中层, 2=副职, 3=主管, 99=普通）
 */
export function getPositionLevel(name: string): number {
  // 高层管理
  if (
    name.includes('总经理') || name.includes('董事长') || name.includes('总裁')
  ) return 0;
  // 中层管理
  if (name.includes('经理') || name.includes('部长') || name.includes('主任')) {
    if (name.includes('副')) return 2;
    return 1;
  }
  // 主管级
  if (name.includes('主管') || name.includes('负责人')) return 3;
  // 普通岗位
  return 99;
}
