'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import NoteTakingInterface from '@/components/NoteTakingInterface'
import type { NoteData } from '@/types/note'

export default function Workspace() {
  const [userNotes, setUserNotes] = useState<NoteData[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
      
      setUserNotes(data || [])
    }

    fetchNotes()
  }, [])

  return <NoteTakingInterface initialNotes={userNotes} />
}
