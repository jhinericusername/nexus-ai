// components/NoteTakingInterface.tsx
'use client'

import React, { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  Undo, 
  Redo,
  Save,
  Mic
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import DrawingCanvas from './DrawingCanvas'
import DraggableTextBox from './DraggableTextBox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { TextBox } from '../types/canvas'

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line'

interface NoteTakingInterfaceProps {
  initialNotes?: any[] // Replace with your note type
}

export default function NoteTakingInterface({ initialNotes = [] }: NoteTakingInterfaceProps) {
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(true)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(2)
  const [tool, setTool] = useState<Tool>('pen')
  
  // Text boxes state
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([])
  const [activeTextBoxId, setActiveTextBoxId] = useState<string | null>(null)

  // Note metadata
  const [title, setTitle] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [currentTimestamp, setCurrentTimestamp] = useState(0)

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  const tools = [
    { icon: Pencil, name: 'pen' as Tool, tooltip: 'Draw (D)' },
    { icon: Eraser, name: 'eraser' as Tool, tooltip: 'Eraser (E)' },
    { icon: Square, name: 'rectangle' as Tool, tooltip: 'Rectangle (R)' },
    { icon: Circle, name: 'circle' as Tool, tooltip: 'Circle (C)' },
    { icon: Minus, name: 'line' as Tool, tooltip: 'Line (L)' },
  ]

  // Text box handlers
  const handleAddTextBox = useCallback(() => {
    const newTextBox: TextBox = {
      id: uuidv4(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      width: 200,
      height: 100,
      content: '',
      isDragging: false
    }
    setTextBoxes(prev => [...prev, newTextBox])
    setActiveTextBoxId(newTextBox.id)
  }, [])

  const updateTextBox = useCallback((id: string, updates: Partial<TextBox>) => {
    setTextBoxes(boxes => 
      boxes.map(box => 
        box.id === id ? { ...box, ...updates } : box
      )
    )
  }, [])

  const deleteTextBox = useCallback((id: string) => {
    setTextBoxes(boxes => boxes.filter(box => box.id !== id))
    if (activeTextBoxId === id) {
      setActiveTextBoxId(null)
    }
  }, [activeTextBoxId])

  // Recording handlers
  const startRecording = useCallback(() => {
    setIsRecording(true)
    setCurrentTimestamp(0)
    recordingTimerRef.current = setInterval(() => {
      setCurrentTimestamp(prev => prev + 1)
    }, 1000)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
  }, [])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'd':
          setTool('pen')
          break
        case 'e':
          setTool('eraser')
          break
        case 'r':
          setTool('rectangle')
          break
        case 'c':
          setTool('circle')
          break
        case 'l':
          setTool('line')
          break
        case 't':
          handleAddTextBox()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleAddTextBox])

  // Format timestamp for display
  const formatTime = (timestamp: number): string => {
    const minutes = Math.floor(timestamp / 60)
    const seconds = timestamp % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Main Note-taking Area (75%) */}
      <div className="w-3/4 h-full p-4 relative">
        {/* Top Toolbar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b z-20">
          <Input
            type="text"
            placeholder="Note Title"
            className="text-xl font-semibold bg-transparent border-none w-1/3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <div className="flex items-center gap-2">
            {/* Drawing Tools */}
            <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
              <TooltipProvider>
                {tools.map(({ icon: Icon, name, tooltip }) => (
                  <Tooltip key={name}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tool === name ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTool(name)}
                        className="w-8 h-8 p-0"
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                
                <div className="w-px h-6 bg-gray-200 mx-1" />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddTextBox}
                      className="w-8 h-8 p-0"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Text Box (T)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Color and Size Controls */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className={isRecording ? 'bg-red-50 text-red-600' : ''}
                onClick={isRecording ? stopRecording : startRecording}
              >
                <Mic className="h-4 w-4 mr-1" />
                {isRecording ? formatTime(currentTimestamp) : 'Record'}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => {/* Save functionality */}}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas and Text Boxes Container */}
      {/* Canvas Container - Takes full height minus toolbar */}
      <div className="absolute inset-0 mt-[53px]"> {/* Fixed height offset for toolbar */}
        <DrawingCanvas
          color={currentColor}
          brushSize={brushSize}
          isDrawingMode={isDrawingMode}
          tool={tool}
          ref={canvasRef}
        />
        
        {/* Text Boxes Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {textBoxes.map(textBox => (
            <div key={textBox.id} className="pointer-events-auto">
              <DraggableTextBox
                textBox={textBox}
                onUpdate={updateTextBox}
                onDelete={deleteTextBox}
                isActive={textBox.id === activeTextBoxId}
                onFocus={() => setActiveTextBoxId(textBox.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>

      {/* AI Chat Interface (25%) */}
      <Card className="w-1/4 h-full border-l bg-white">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">AI Assistant</h2>
            <p className="text-sm text-gray-500">Ask questions about your notes</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                I can help you understand and organize your notes. Try asking me a question!
              </div>
            </div>
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask a question..."
                className="flex-1"
              />
              <Button size="sm">Send</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}