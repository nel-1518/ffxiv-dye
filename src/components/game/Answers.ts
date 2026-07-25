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
}