// types/recording.ts
export interface StrokePoint {
    x: number
    y: number
    timestamp: number
    pressure?: number
  }
  
  export interface Stroke {
    id: string
    type: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line'
    points: StrokePoint[]
    color: string
    brushSize: number
    timestamp: number
  }
  
  export interface TextEntry {
    id: string
    content: string
    x: number
    y: number
    timestamp: number
  }
  
  export interface Recording {
    id: string
    note_id: string
    audio_url: string
    start_time: number
    duration: number
    strokes: Stroke[]
    text_entries: TextEntry[]
  }
  // types/recording.ts
export interface Point {
    x: number;
    y: number;
    pressure?: number;
    timestamp: number;
  }
  
  export interface Stroke {
    id: string;
    type: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';
    points: Point[];
    color: string;
    brushSize: number;
    timestamp: number;
  }
  
  export interface Keystroke {
    id: string;
    type: 'keystroke' | 'deletion';
    key: string;
    timestamp: number;
    position?: {
      x: number;
      y: number;
    };
  }
  