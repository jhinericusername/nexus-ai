// components/NoteTakingInterface.tsx
'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  Save,
  Mic, 
  StopCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import DrawingCanvas from './DrawingCanvas'
import DraggableTextBox from './DraggableTextBox'
import { RecordingManager } from '@/lib/RecordingManager'
import type { TextBox } from '@/types/canvas'
import type { Stroke } from '@/types/recording'

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line'

interface NoteTakingInterfaceProps {
  noteId?: string
}

// Recording Indicator Component
const RecordingIndicator = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
      <span className="text-red-600 text-sm font-medium">Recording</span>
    </div>
  )
}

export default function NoteTakingInterface({ noteId = uuidv4() }: NoteTakingInterfaceProps) {
  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState(true)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(2)
  const [tool, setTool] = useState<Tool>('pen')
  
  // Text boxes state
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([])
  const [activeTextBoxId, setActiveTextBoxId] = useState<string | null>(null)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const recordingManagerRef = useRef<RecordingManager | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Note metadata
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Tools configuration
  const tools = [
    { icon: Pencil, name: 'pen' as Tool, tooltip: 'Draw (D)' },
    { icon: Eraser, name: 'eraser' as Tool, tooltip: 'Eraser (E)' },
    { icon: Square, name: 'rectangle' as Tool, tooltip: 'Rectangle (R)' },
    { icon: Circle, name: 'circle' as Tool, tooltip: 'Circle (C)' },
    { icon: Minus, name: 'line' as Tool, tooltip: 'Line (L)' },
  ]


  const [question, setQuestion] = useState<string>(''); // State for user input question
const [chatHistory, setChatHistory] = useState<{ type: 'user' | 'ai', content: string }[]>([]); // Chat messages
const [isFetchingAnswer, setIsFetchingAnswer] = useState<boolean>(false); // Loading state for API call

const handleSendQuestion = async () => {
  if (!question.trim()) return;

  setChatHistory(prev => [...prev, { type: 'user', content: question }]); // Add user question to chat
  setQuestion(''); // Clear input
  setIsFetchingAnswer(true);

  try {
    // Replace with your Flask API endpoint
    const response = await fetch('http://127.0.0.1:5000/answer-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_name: 'notes', // Table name in Supabase
        file_column: 'file_url', // Column containing the document URL
        document_id: noteId, // Pass the noteId
        question,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch the AI response');
    }

    const data = await response.json();
    setChatHistory(prev => [...prev, { type: 'ai', content: data.answer }]); // Add AI answer to chat
  } catch (error) {
    console.error('Error fetching AI response:', error);
    setChatHistory(prev => [...prev, { type: 'ai', content: 'Sorry, I could not process your question.' }]);
  } finally {
    setIsFetchingAnswer(false);
  }
};


  // Recording keystrokes
  useEffect(() => {
    if (isRecording) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (recordingManagerRef.current) {
          let position;
          if (e.target instanceof HTMLTextAreaElement) {
            const textarea = e.target;
            position = {
              x: textarea.selectionStart || 0,
              y: textarea.selectionEnd || 0
            };
          }
          recordingManagerRef.current.recordKeystroke(e.key, position);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isRecording]);

  // Handle strokes during recording
  const handleStroke = useCallback((stroke: Omit<Stroke, 'timestamp' | 'id'>) => {
    if (isRecording && recordingManagerRef.current) {
      recordingManagerRef.current.recordStroke(stroke);
    }
  }, [isRecording]);

  // Start recording
  const startRecording = async () => {
    try {
      if (!title) {
        toast({
          title: "Title Required",
          description: "Please add a title before recording",
          variant: "destructive",
        });
        return;
      }

      const manager = new RecordingManager(noteId);
      await manager.startRecording();
      recordingManagerRef.current = manager;
      setIsRecording(true);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Recording audio, keystrokes, and drawings",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to start recording:', errorMessage);
      toast({
        title: "Recording Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      if (recordingManagerRef.current) {
        await recordingManagerRef.current.stopRecording();
        
        // Auto-save after stopping recording
        await handleSave();
        
        recordingManagerRef.current = null;
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecording(false);
      setRecordingTime(0);

      toast({
        title: "Recording Saved",
        description: "Your recording and notes have been saved successfully",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to stop recording:', errorMessage);
      toast({
        title: "Save Failed",
        description: `Failed to save recording: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };
  const handleAddTextBox = useCallback(() => {
    const newTextBox: TextBox = {
      id: uuidv4(),
      content: '',
      x: Math.random() * 100,
      y: Math.random() * 100,
      width: 200,
      height: 100,
      isDragging: false,
      timestamp: Date.now()
    };
  
    setTextBoxes(prev => [...prev, newTextBox]);
    setActiveTextBoxId(newTextBox.id);
  
    if (isRecording && recordingManagerRef.current) {
      try {
        recordingManagerRef.current.recordTextbox(
          newTextBox.content,
          newTextBox.x,
          newTextBox.y
        ).catch(error => {
          console.error('Failed to record textbox:', error);
          toast({
            title: "Error",
            description: "Failed to record textbox",
            variant: "destructive",
          });
        });
      } catch (error) {
        console.error('Failed to record textbox:', error);
      }
    }
  }, [isRecording, toast]);
  
  // Also update the text change handler
  const updateTextBox = useCallback((id: string, updates: Partial<TextBox>) => {
    setTextBoxes(boxes => 
      boxes.map(box => {
        if (box.id === id) {
          const updatedBox = { ...box, ...updates };
          // Record the update if we're recording
          if (isRecording && recordingManagerRef.current && 'content' in updates) {
            recordingManagerRef.current.recordTextbox(
              updatedBox.content,
              updatedBox.x,
              updatedBox.y
            ).catch(console.error);
          }
          return updatedBox;
        }
        return box;
      })
    );
  }, [isRecording]);

  const deleteTextBox = useCallback((id: string) => {
    setTextBoxes(boxes => boxes.filter(box => box.id !== id))
    if (activeTextBoxId === id) {
      setActiveTextBoxId(null)
    }
  }, [activeTextBoxId])

  // Save functionality
  const handleSave = async () => {
    try {
      if (!title) {
        toast({
          title: "Title Required",
          description: "Please add a title before saving",
          variant: "destructive",
        })
        return
      }

      setIsSaving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save note metadata
      const { error: noteError } = await supabase
        .from('notes')
        .upsert({
          id: noteId,
          user_id: user.id,
          title,
          updated_at: new Date().toISOString()
        })

      if (noteError) throw noteError

      // Save canvas state
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL()
        const { error: storageError } = await supabase.storage
          .from('notes')
          .upload(`${user.id}/${noteId}/canvas.png`, dataURItoBlob(dataUrl), {
            upsert: true
          })

        if (storageError) throw storageError
      }

      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Failed to save note:', errorMessage)
      toast({
        title: "Save Failed",
        description: `Failed to save note: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Utility functions
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1])
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ab], { type: mimeString })
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (recordingManagerRef.current && isRecording) {
        recordingManagerRef.current.stopRecording().catch(console.error)
      }
    }
  }, [isRecording])

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Main Note-taking Area (75%) */}
      <div className="w-3/4 h-full relative">
        {/* Top Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2 bg-white/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between">
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
              {isRecording ? (
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={stopRecording}
                  className="flex items-center gap-2"
                >
                  <StopCircle className="h-4 w-4" />
                  <RecordingIndicator />
                  {formatTime(recordingTime)}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={startRecording}
                  disabled={!title}
                  className="flex items-center gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Record
                </Button>
              )}

              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={!title || isSaving}
              >
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas and Text Boxes Container */}
        <div className="absolute inset-0 mt-[53px]">
          <DrawingCanvas
            ref={canvasRef}
            color={currentColor}
            brushSize={brushSize}
            isDrawingMode={isDrawingMode}
            tool={tool}
            onStroke={handleStroke}
            isRecording={isRecording}
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
      <p className="text-sm text-gray-500">
        {isRecording
          ? "Recording in progress - Ask questions about your notes"
          : "Ask questions about your notes"}
      </p>
    </div>

    {/* Chat Display */}
    <div className="flex-1 overflow-y-auto p-4">
      {chatHistory.map((message, index) => (
        <div
          key={index}
          className={`rounded-lg p-3 text-sm ${
            message.type === 'user' ? 'bg-gray-100 self-end' : 'bg-blue-50'
          }`}
        >
          {message.content}
        </div>
      ))}
      {isFetchingAnswer && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm animate-pulse">
          Fetching response...
        </div>
      )}
    </div>

    {/* Input Section */}
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1"
          disabled={isRecording || isFetchingAnswer}
        />
        <Button
          size="sm"
          onClick={handleSendQuestion}
          disabled={isRecording || isFetchingAnswer}
        >
          Send
        </Button>
      </div>
      {isRecording && (
        <p className="text-xs text-gray-500 mt-2">
          Chat is disabled during recording to prevent audio interference.
        </p>
      )}
    </div>
  </div>
</Card>


      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">
                Keyboard Shortcuts
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <div className="space-y-2">
                <p><kbd>D</kbd> - Draw</p>
                <p><kbd>E</kbd> - Eraser</p>
                <p><kbd>R</kbd> - Rectangle</p>
                <p><kbd>C</kbd> - Circle</p>
                <p><kbd>L</kbd> - Line</p>
                <p><kbd>T</kbd> - Add Text Box</p>
                <p><kbd>Ctrl/Cmd + S</kbd> - Save</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Recording Duration Display */}
      {isRecording && (
        <div className="fixed bottom-4 left-4 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          Recording: {formatTime(recordingTime)}
        </div>
      )}
    </div>
  )
}

