import { Color } from "../../types/color"

export class Option {

  color: Color
  // 标记是否为正确答案
  correctAnswer: boolean
  mark: boolean

  constructor(color: Color, correctAnswer: boolean, mark: boolean) {
    this.color = color
    this.correctAnswer = correctAnswer
    this.mark = mark
  }
}