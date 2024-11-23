// lib/RecordingManager.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

interface Stroke {
  id: string;
  type: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';
  points: Point[];
  color: string;
  brushSize: number;
  timestamp: number;
}

interface KeystrokeData {
  id: string;
  key: string;
  type: 'keystroke' | 'deletion';
  position?: {
    x: number;
    y: number;
  };
  timestamp: number;
}

interface TextBoxData {
  id: string;
  content: string;
  x: number;
  y: number;
  timestamp: number;
}

export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private supabase = createClientComponentClient();
  private recordingId: string;
  private noteId: string;
  private userId: string | undefined;
  private stream: MediaStream | null = null;
  private strokes: Stroke[] = [];
  private keystrokes: KeystrokeData[] = [];
  private textBoxes: TextBoxData[] = [];
  private isRecording: boolean = false;

  constructor(noteId: string) {
    this.noteId = noteId;
    this.recordingId = crypto.randomUUID();
  }

  async startRecording(): Promise<number> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      this.userId = user.id;

      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      this.startTime = Date.now();
      this.isRecording = true;

      // Create recording entry
      const { error: recordingError } = await this.supabase
        .from('recordings')
        .insert({
          id: this.recordingId,
          note_id: this.noteId,
          user_id: this.userId,
          start_time: this.startTime,
          status: 'recording'
        });

      if (recordingError) throw recordingError;

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          await this.saveAudioChunk(event.data, this.audioChunks.length);
        }
      };

      this.mediaRecorder.start(1000); // Record in 1-second chunks
      return this.startTime;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async recordKeystroke(key: string, position?: { x: number; y: number }): Promise<void> {
    if (!this.isRecording || !this.userId) return;

    const keystrokeData: KeystrokeData = {
      id: crypto.randomUUID(),
      key,
      type: key === 'Backspace' || key === 'Delete' ? 'deletion' : 'keystroke',
      position,
      timestamp: Date.now() - this.startTime
    };

    try {
      const { error } = await this.supabase
        .from('keystrokes')
        .insert({
          recording_id: this.recordingId,
          user_id: this.userId,
          keystroke_data: keystrokeData,
          timestamp: keystrokeData.timestamp
        });

      if (error) throw error;
      this.keystrokes.push(keystrokeData);
    } catch (error) {
      console.error('Error recording keystroke:', error);
      throw error;
    }
  }

  async recordStroke(stroke: Omit<Stroke, 'id' | 'timestamp'>): Promise<void> {
    if (!this.isRecording || !this.userId) return;

    const strokeData: Stroke = {
      ...stroke,
      id: crypto.randomUUID(),
      timestamp: Date.now() - this.startTime
    };

    try {
      const { error } = await this.supabase
        .from('strokes')
        .insert({
          recording_id: this.recordingId,
          user_id: this.userId,
          stroke_data: strokeData,
          timestamp: strokeData.timestamp
        });

      if (error) throw error;
      this.strokes.push(strokeData);
    } catch (error) {
      console.error('Error recording stroke:', error);
      throw error;
    }
  }

  async recordTextbox(content: string, x: number, y: number): Promise<void> {
    if (!this.isRecording || !this.userId) return;

    const textBoxData: TextBoxData = {
      id: crypto.randomUUID(),
      content,
      x,
      y,
      timestamp: Date.now() - this.startTime
    };

    try {
      const { error } = await this.supabase
        .from('textboxes')
        .insert({
          recording_id: this.recordingId,
          user_id: this.userId,
          textbox_data: textBoxData,
          timestamp: textBoxData.timestamp
        });

      if (error) throw error;
      this.textBoxes.push(textBoxData);
    } catch (error) {
      console.error('Error recording textbox:', error);
      throw error;
    }
  }

  private async saveAudioChunk(chunk: Blob, chunkNumber: number): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await this.supabase.storage
        .from('recordings')
        .upload(
          `${this.userId}/${this.recordingId}/chunks/chunk_${chunkNumber}.webm`,
          chunk,
          { contentType: 'audio/webm' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error saving audio chunk:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.mediaRecorder || !this.userId) {
      throw new Error('No active recording');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          // Upload final audio file
          const { data: audioData, error: audioError } = await this.supabase.storage
            .from('recordings')
            .upload(
              `${this.userId}/${this.recordingId}/recording.webm`,
              audioBlob,
              { contentType: 'audio/webm' }
            );

          if (audioError) throw audioError;

          // Update recording entry with all data
          const { error: updateError } = await this.supabase
            .from('recordings')
            .update({
              status: 'completed',
              end_time: Date.now(),
              audio_url: audioData?.path,
              strokes: this.strokes,
              keystrokes: this.keystrokes,
              textboxes: this.textBoxes
            })
            .match({ id: this.recordingId });

          if (updateError) throw updateError;

          // Cleanup
          if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
          }

          this.isRecording = false;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder?.stop();
    });
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getCurrentTime(): number {
    return this.isRecording ? Date.now() - this.startTime : 0;
  }
}