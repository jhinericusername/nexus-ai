// types/note.ts
export interface TimeStampedText {
    text: string;
    timestamp: number;
}
  
export interface NoteData {
    id?: string;
    title: string;
    content: TimeStampedText[];
    audio_url?: string;
    created_at?: string;
    user_id?: string;
}