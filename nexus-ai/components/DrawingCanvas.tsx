// components/DrawingCanvas.tsx
'use client'

import React, { useEffect, useState, forwardRef, useCallback } from 'react'

interface Point {
  x: number
  y: number
}

interface DrawingCanvasProps {
  color: string
  brushSize: number
  isDrawingMode: boolean
  tool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line'
}

const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({ color, brushSize, isDrawingMode, tool }, ref) => {
    const [isDrawing, setIsDrawing] = useState(false)
    const [startPoint, setStartPoint] = useState<Point | null>(null)
    const contextRef = React.useRef<CanvasRenderingContext2D | null>(null)
    const [history, setHistory] = useState<ImageData[]>([])
    const lastPoint = React.useRef<Point | null>(null)

    const initializeCanvas = useCallback(() => {
      const canvas = ref instanceof Function ? null : ref?.current
      if (!canvas) return

      const container = canvas.parentElement
      if (!container) return

      // Set canvas size
      const rect = container.getBoundingClientRect()
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      canvas.width = rect.width
      canvas.height = rect.height

      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return

      // Configure context
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = tool === 'eraser' ? '#ffffff' : color
      context.lineWidth = brushSize
      contextRef.current = context

      // Initialize with white background if no history
      if (history.length === 0) {
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        saveState()
      } else {
        // Restore last state
        const lastState = history[history.length - 1]
        context.putImageData(lastState, 0, 0)
      }
    }, [ref, color, brushSize, tool, history])

    useEffect(() => {
      initializeCanvas()
      window.addEventListener('resize', initializeCanvas)
      return () => window.removeEventListener('resize', initializeCanvas)
    }, [initializeCanvas])

    useEffect(() => {
      if (contextRef.current) {
        contextRef.current.strokeStyle = tool === 'eraser' ? '#ffffff' : color
        contextRef.current.lineWidth = brushSize
      }
    }, [color, brushSize, tool])

    const saveState = () => {
      const canvas = ref instanceof Function ? null : ref?.current
      if (!canvas || !contextRef.current) return

      const currentState = contextRef.current.getImageData(0, 0, canvas.width, canvas.height)
      setHistory(prev => [...prev, currentState])
    }

    const getPoint = (e: React.PointerEvent): Point => {
      const canvas = ref instanceof Function ? null : ref?.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    const drawShape = (start: Point, end: Point, isPreview = false) => {
      if (!contextRef.current) return

      const context = contextRef.current

      // If preview, restore previous state first
      if (isPreview && history.length > 0) {
        context.putImageData(history[history.length - 1], 0, 0)
      }

      context.beginPath()
      context.strokeStyle = tool === 'eraser' ? '#ffffff' : color

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

      if (!isPreview) {
        saveState()
      }
    }

    const startDrawing = (e: React.PointerEvent) => {
      if (!isDrawingMode || !contextRef.current) return

      e.preventDefault()
      const point = getPoint(e)
      setIsDrawing(true)
      setStartPoint(point)
      lastPoint.current = point

      if (tool === 'pen' || tool === 'eraser') {
        contextRef.current.beginPath()
        contextRef.current.moveTo(point.x, point.y)
      }
    }

    const draw = (e: React.PointerEvent) => {
      if (!isDrawing || !isDrawingMode || !contextRef.current || !lastPoint.current) return

      e.preventDefault()
      const point = getPoint(e)

      if (tool === 'pen' || tool === 'eraser') {
        contextRef.current.beginPath()
        contextRef.current.moveTo(lastPoint.current.x, lastPoint.current.y)
        contextRef.current.lineTo(point.x, point.y)
        contextRef.current.stroke()
        lastPoint.current = point
      } else {
        drawShape(startPoint!, point, true)
      }
    }

    const stopDrawing = (e: React.PointerEvent) => {
      if (!isDrawing) return

      if (tool !== 'pen' && tool !== 'eraser' && startPoint) {
        const point = getPoint(e)
        drawShape(startPoint, point)
      } else {
        saveState()
      }

      setIsDrawing(false)
      setStartPoint(null)
      lastPoint.current = null
    }

    return (
      <canvas
        ref={ref}
        className="absolute inset-0 w-full h-full touch-none"
        style={{ 
          opacity: isDrawingMode ? 1 : 0.5,
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          backgroundColor: 'white'
        }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        onPointerCancel={stopDrawing}
      />
    )
  }
)

DrawingCanvas.displayName = 'DrawingCanvas'

export default DrawingCanvas