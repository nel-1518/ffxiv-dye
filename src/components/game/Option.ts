import { Color } from "../../types/color"

export class Option {

  color: Color
  // 标记是否为正确答案
  correctAnswer: boolean

  constructor(color: Color, correctAnswer: boolean) {
    this.color = color
    this.correctAnswer = correctAnswer
  }
}