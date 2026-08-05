import type { Scheme } from '../types/scheme'

// AI 生成的颜色搭配
export const schemes: Scheme[] = [
  {
    id: 'rose-gold',
    name: '玫瑰金',
    light: { primary: '#CC6C5E', bg: '#F9F8F4', card: '#ffffff', text: '#1E1E1E', ring: '#451511' },
    dark: { primary: '#a24730', bg: '#1a1a1a', card: '#2a2a2a', text: '#f2d3b6', ring: '#8B3A32' },
    diamonds: [
      { hex: '#E69F96', name: '玫瑰粉' },
      { hex: '#CC6C5E', name: '珊瑚粉' },
      { hex: '#FAC62B', name: '蜂蜜黄' },
      { hex: '#F2D770', name: '奶油黄' },
      { hex: '#E49E34', name: '玉米黄' },
    ],
  },
  {
    id: 'ocean',
    name: '深海秘境',
    light: { primary: '#04AFCD', bg: '#e8eef5', card: '#f7f9fc', text: '#181937', ring: '#312D57' },
    dark: { primary: '#048B9E', bg: '#1a1a1a', card: '#2a2a2a', text: '#f2d3b6', ring: '#5B5599' },
    diamonds: [
      { hex: '#83B0D2', name: '天空蓝' },
      { hex: '#04AFCD', name: '松石蓝' },
      { hex: '#B2C4CE', name: '寒冰蓝' },
      { hex: '#6481A0', name: '海雾蓝' },
      { hex: '#5B7FC0', name: '盗龙蓝' },
    ],
  },
  {
    id: 'forest',
    name: '森林低语',
    light: { primary: '#9BB363', bg: '#eef2e6', card: '#fafcf7', text: '#323621', ring: '#1E2A21' },
    dark: { primary: '#7A9449', bg: '#1a1a1a', card: '#2a2a2a', text: '#f2d3b6', ring: '#4A6B52' },
    diamonds: [
      { hex: '#9BB363', name: '苹果绿' },
      { hex: '#BBBB8A', name: '妖精绿' },
      { hex: '#8B9C63', name: '牧草绿' },
      { hex: '#658241', name: '仙人掌' },
      { hex: '#ABB054', name: '青柠绿' },
    ],
  },
  {
    id: 'purple-haze',
    name: '紫罗兰梦',
    light: { primary: '#877FAE', bg: '#f2edf5', card: '#fdfbfe', text: '#322C3B', ring: '#3B2A3D' },
    dark: { primary: '#6A5E99', bg: '#1a1a1a', card: '#2a2a2a', text: '#f2d3b6', ring: '#6A4D6E' },
    diamonds: [
      { hex: '#B79EBC', name: '鸢尾紫' },
      { hex: '#877FAE', name: '薰衣草' },
      { hex: '#DC9BCA', name: '蜂鸟粉' },
      { hex: '#BBB5DA', name: '柔彩紫' },
      { hex: '#62508F', name: '罗兰紫' },
    ],
  },
  {
    id: 'sunset',
    name: '落日余晖',
    light: { primary: '#C57424', bg: '#faf3e8', card: '#fffdf9', text: '#2B2923', ring: '#451511' },
    dark: { primary: '#A05E1A', bg: '#1a1a1a', card: '#2a2a2a', text: '#f2d3b6', ring: '#8B3A32' },
    diamonds: [
      { hex: '#B75C2D', name: '日落橙' },
      { hex: '#C57424', name: '南瓜橙' },
      { hex: '#F2D770', name: '奶油黄' },
      { hex: '#E49E34', name: '玉米黄' },
      { hex: '#DBB457', name: '沙漠黄' },
    ],
  },
  {
    id: 'graphite',
    name: '石墨雅致',
    light: { primary: '#656565', bg: '#E4DFD0', card: '#fcfbf8', text: '#1E1E1E', ring: '#1E1E1E' },
    dark: { primary: '#898784', bg: '#1a1a1a', card: '#2a2a2a', text: '#f2d3b6', ring: '#808080' },
    diamonds: [
      { hex: '#656565', name: '石板灰' },
      { hex: '#898784', name: '古菩灰' },
      { hex: '#ACA8A2', name: '苍白灰' },
      { hex: '#484742', name: '木炭灰' },
      { hex: '#E4DFD0', name: '素雪白' },
    ],
  },
  {
    id: 'cherry-blossom',
    name: '樱吹雪',
    light: { primary: '#F5379B', bg: '#fff5f8', card: '#fffbfc', text: '#321919', ring: '#5B1729' },
    dark: { primary: '#C42D7D', bg: '#1a1a1a', card: '#2a2a2a', text: '#f2d3b6', ring: '#9E2D4D' },
    diamonds: [
      { hex: '#FECEF5', name: '莲花粉' },
      { hex: '#F5379B', name: '樱桃粉' },
      { hex: '#ED118E', name: '霓虹粉' },
      { hex: '#FDC8C6', name: '柔彩粉' },
      { hex: '#DE0B16', name: '胭脂红' },
    ],
  },
  {
    id: 'vintage',
    name: '复古胶片',
    light: { primary: '#B77D36', bg: '#f5efe4', card: '#fdfaf5', text: '#30211B', ring: '#3D290D' },
    dark: { primary: '#8C6029', bg: '#1a1a1a', card: '#2a2a2a', text: '#f2d3b6', ring: '#7A5520' },
    diamonds: [
      { hex: '#B9A489', name: '哥布林' },
      { hex: '#A2875C', name: '山羊棕' },
      { hex: '#DBB457', name: '沙漠黄' },
      { hex: '#C99156', name: '软木棕' },
      { hex: '#92816C', name: '页岩棕' },
    ],
  },
]
