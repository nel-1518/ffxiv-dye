import { Color } from "../../types/color";

export class Answers {

  colors: Color[] = [];
  private index = 0;

  constructor() {
  }

  put = (colors: Color[]) => {
    this.colors = colors
    this.index = 0
  }

  next = (): Color => {
    return this.colors[(this.index)++]
  }

  // 替换当前题目的颜色（敏慧换题时同步结果页格子）
  replaceLast = (color: Color) => {
    this.colors[this.index - 1] = color
  }
}