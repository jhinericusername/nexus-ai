// types/canvas.ts
export interface Point {
    x: number
    y: number
  }
  
  export interface DrawingAction {
    type: 'draw' | 'erase'
    points: Point[]
    color: string
    size: number
  }
  
  export interface TextBox {
    id: string
    x: number
    y: number
    width: number
    height: number
    content: string
    isDragging: boolean
    timestamp: number
  }