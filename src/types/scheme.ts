export interface SchemeColors {
  primary: string
  bg: string
  card: string
  text: string
  ring: string
}

export interface SchemeDiamond {
  hex: string
  name: string
}

export interface Scheme {
  id: string
  name: string
  light: SchemeColors
  dark: SchemeColors
  diamonds: SchemeDiamond[]
}

export interface CircleLayout {
  x: number
  y: number
  d: number
}
