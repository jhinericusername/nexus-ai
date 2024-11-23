'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Eraser, Square, Circle, Minus, Undo, Redo, Type } from 'lucide-react'

interface ToolBarProps {
  tool: string
  setTool: (tool: string) => void
  onUndo: () => void
  onRedo: () => void
  onAddTextBox: () => void
  color: string
  setColor: (color: string) => void
  brushSize: number
  setBrushSize: (size: number) => void
}

export default function ToolBar(props: ToolBarProps) {
  const tools = [
    { icon: Pencil, name: 'pen' },
    { icon: Eraser, name: 'eraser' },
    { icon: Square, name: 'rectangle' },
    { icon: Circle, name: 'circle' },
    { icon: Minus, name: 'line' },
  ]

  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow">
      {tools.map(({ icon: Icon, name }) => (
        <Button
          key={name}
          variant={props.tool === name ? "default" : "outline"}
          size="sm"
          onClick={() => props.setTool(name)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
      
      <div className="h-6 w-px bg-gray-200" />
      
      <Button variant="outline" size="sm" onClick={props.onUndo}>
        <Undo className="h-4 w-4" />
      </Button>
      
      <Button variant="outline" size="sm" onClick={props.onRedo}>
        <Redo className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-gray-200" />

      <Button variant="outline" size="sm" onClick={props.onAddTextBox}>
        <Type className="h-4 w-4" />
      </Button>
      
      <input
        type="color"
        value={props.color}
        onChange={(e) => props.setColor(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer"
      />
      
      <input
        type="range"
        min="1"
        max="20"
        value={props.brushSize}
        onChange={(e) => props.setBrushSize(Number(e.target.value))}
        className="w-24"
      />
    </div>
  )
}