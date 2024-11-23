'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { TextBox } from '../types/canvas'

interface DraggableTextBoxProps {
  textBox: TextBox
  onUpdate: (id: string, updates: Partial<TextBox>) => void
  onDelete: (id: string) => void
  isActive?: boolean
  onFocus: () => void
}

export default function DraggableTextBox({
  textBox,
  onUpdate,
  onDelete,
  isActive,
  onFocus
}: DraggableTextBoxProps) {
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={false}
      animate={{
        x: textBox.x,
        y: textBox.y,
        scale: isActive ? 1.02 : 1,
        zIndex: isDragging ? 50 : 10
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false)
        onUpdate(textBox.id, {
          x: textBox.x + info.offset.x,
          y: textBox.y + info.offset.y
        })
      }}
      className={`absolute bg-white rounded-lg shadow-lg ${
        isActive ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200'
      }`}
      style={{
        width: textBox.width,
        height: textBox.height,
        touchAction: 'none'
      }}
      onClick={onFocus}
    >
      <div 
        className="p-2 cursor-move bg-gray-50 rounded-t-lg flex items-center justify-between"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-gray-500">Text Box</div>
        <button
          onClick={() => onDelete(textBox.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          ×
        </button>
      </div>

      <textarea
        ref={textareaRef}
        className="w-full p-2 resize-none focus:outline-none rounded-b-lg"
        style={{ height: 'calc(100% - 36px)' }}
        value={textBox.content}
        onChange={(e) => onUpdate(textBox.id, { content: e.target.value })}
        onFocus={onFocus}
        placeholder="Type here..."
      />

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onPointerDown={(e) => {
          e.stopPropagation()
          const startX = e.clientX
          const startY = e.clientY
          const startWidth = textBox.width
          const startHeight = textBox.height

          const handleResize = (moveEvent: PointerEvent) => {
            const dx = moveEvent.clientX - startX
            const dy = moveEvent.clientY - startY
            onUpdate(textBox.id, {
              width: Math.max(200, startWidth + dx),
              height: Math.max(100, startHeight + dy)
            })
          }

          const handlePointerUp = () => {
            document.removeEventListener('pointermove', handleResize)
            document.removeEventListener('pointerup', handlePointerUp)
          }

          document.addEventListener('pointermove', handleResize)
          document.addEventListener('pointerup', handlePointerUp)
        }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full text-gray-300">
          <path d="M22 22L12 22L22 12L22 22Z" fill="currentColor"/>
        </svg>
      </div>
    </motion.div>
  )
}