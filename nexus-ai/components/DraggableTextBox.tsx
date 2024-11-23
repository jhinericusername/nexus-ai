'use client'

import { useState, useRef } from 'react'
import { TextBox } from '@/types/canvas'
import { motion, useDragControls } from 'framer-motion'

interface DraggableTextBoxProps {
    textBox: TextBox;
    onUpdate: (id: string, updates: Partial<TextBox>) => void;
    onDelete: (id: string) => void;
    isActive?: boolean;
    onFocus: () => void;
}
export default function DraggableTextBox({
  textBox,
  onUpdate,
  onDelete
}: DraggableTextBoxProps) {
  const [isEditing, setIsEditing] = useState(false)
  const controls = useDragControls()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <motion.div
      drag
      dragControls={controls}
      dragMomentum={false}
      initial={{ x: textBox.x, y: textBox.y }}
      className="absolute min-w-[200px] min-h-[100px] bg-white rounded-lg shadow-lg border border-gray-200"
    >
      <div className="p-2 cursor-move bg-gray-50 rounded-t-lg"
           onPointerDown={(e) => controls.start(e)}
      >
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">Text Box</div>
          <button
            onClick={() => onDelete(textBox.id)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="w-full p-2 resize-none focus:outline-none rounded-b-lg"
        value={textBox.content}
        onChange={(e) => onUpdate(textBox.id, { content: e.target.value })}
        style={{ height: textBox.height }}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
      />
    </motion.div>
  )
}
