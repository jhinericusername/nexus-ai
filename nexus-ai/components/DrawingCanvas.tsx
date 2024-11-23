// components/DrawingCanvas.tsx
'use client'

import React, { useEffect, useState, forwardRef, ForwardedRef } from 'react'
import type { Point, DrawingAction } from '../types/canvas'

interface DrawingCanvasProps {
  color: string
  brushSize: number
  isDrawingMode: boolean
  tool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line'
  onUndo?: () => void
  onRedo?: () => void
}

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({ color, brushSize, isDrawingMode, tool, onUndo, onRedo }, ref) => {
    const [isDrawing, setIsDrawing] = useState(false)
    const [startPoint, setStartPoint] = useState<Point | null>(null)
    const contextRef = React.useRef<CanvasRenderingContext2D | null>(null)
    const [history, setHistory] = useState<ImageData[]>([])
    const [redoStack, setRedoStack] = useState<ImageData[]>([])
    const currentPathRef = React.useRef<Point[]>([])
    const tempCanvasRef = React.useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
      const canvas = ref instanceof Function ? null : ref?.current
      if (!canvas) return

      // Set up main canvas
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return

      // Set up canvas dimensions
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      
      context.scale(dpr, dpr)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = color
      context.lineWidth = brushSize
      contextRef.current = context

      // Set up temporary canvas for shape preview
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempCanvasRef.current = tempCanvas

      // Save initial state
      const initialState = context.getImageData(0, 0, canvas.width, canvas.height)
      setHistory([initialState])
    }, [ref, color, brushSize])

    const saveState = () => {
      const canvas = ref instanceof Function ? null : ref?.current
      if (!canvas || !contextRef.current) return

      const currentState = contextRef.current.getImageData(0, 0, canvas.width, canvas.height)
      setHistory(prev => [...prev, currentState])
      setRedoStack([]) // Clear redo stack on new action
    }

    const drawShape = (start: Point, end: Point, context: CanvasRenderingContext2D, preview = false) => {
      context.beginPath()
      context.strokeStyle = tool === 'eraser' ? '#ffffff' : color
      context.lineWidth = brushSize

      switch (tool) {
        case 'rectangle':
          context.rect(
            start.x,
            start.y,
            end.x - start.x,
            end.y - start.y
          )
          break
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          )
          context.arc(start.x, start.y, radius, 0, 2 * Math.PI)
          break
        case 'line':
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          break
      }
      
      context.stroke()
      if (!preview) saveState()
    }

    const startDrawing = (e: React.PointerEvent) => {
      if (!isDrawingMode) return

      const canvas = ref instanceof Function ? null : ref?.current
      if (!canvas || !contextRef.current) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setIsDrawing(true)
      setStartPoint({ x, y })
      currentPathRef.current = [{ x, y }]

      if (tool === 'pen' || tool === 'eraser') {
        contextRef.current.beginPath()
        contextRef.current.moveTo(x, y)
      }
    }

    const draw = (e: React.PointerEvent) => {
      if (!isDrawing || !isDrawingMode || !startPoint) return

      const canvas = ref instanceof Function ? null : ref?.current
      if (!canvas || !contextRef.current) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      if (tool === 'pen' || tool === 'eraser') {
        contextRef.current.lineTo(x, y)
        contextRef.current.stroke()
        currentPathRef.current.push({ x, y })
      } else {
        // Preview shape on temporary canvas
        const tempCanvas = tempCanvasRef.current
        if (!tempCanvas) return

        const tempContext = tempCanvas.getContext('2d')
        if (!tempContext) return

        // Clear temp canvas and copy current state
        tempContext.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
        tempContext.putImageData(history[history.length - 1], 0, 0)

        // Draw shape preview
        drawShape(startPoint, { x, y }, tempContext, true)
        
        // Copy temp canvas to main canvas
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height)
        contextRef.current.drawImage(tempCanvas, 0, 0)
      }
    }

    const stopDrawing = (e: React.PointerEvent) => {
      if (!isDrawing || !startPoint) return

      const canvas = ref instanceof Function ? null : ref?.current
      if (!canvas || !contextRef.current) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      if (tool !== 'pen' && tool !== 'eraser') {
        drawShape(startPoint, { x, y }, contextRef.current)
      } else if (currentPathRef.current.length > 1) {
        saveState()
      }

      setIsDrawing(false)
      setStartPoint(null)
      currentPathRef.current = []
    }

    return (
      <canvas
        ref={ref}
        className="absolute inset-0 z-10 cursor-crosshair touch-none"
        style={{ 
          opacity: isDrawingMode ? 1 : 0.5,
          cursor: tool === 'eraser' ? 'cell' : 'crosshair'
        }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
    )
  }
)

// Always add a display name for forwardRef components
DrawingCanvas.displayName = 'DrawingCanvas'

export default DrawingCanvas