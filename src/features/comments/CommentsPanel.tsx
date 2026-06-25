import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Send, User } from 'lucide-react'
import { useRoadmapStore } from '@/features/roadmap/store'
import type { Comment } from '@/features/roadmap/types'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { formatClock } from '@/lib/time'

const AUTHOR_KEY = 'tracker-last-author'

interface CommentsPanelProps {
  stepId: string
  comments: Comment[]
  compact?: boolean
}

export function CommentsPanel({ stepId, comments, compact }: CommentsPanelProps) {
  const addComment = useRoadmapStore((s) => s.addComment)
  const [author, setAuthor] = useState(() => localStorage.getItem(AUTHOR_KEY) ?? '')
  const [text, setText] = useState('')

  const submit = () => {
    if (!text.trim()) return
    localStorage.setItem(AUTHOR_KEY, author)
    addComment(stepId, author, text)
    setText('')
  }

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <MessageSquare className="size-4" />
          Commentaires ({comments.length})
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-border/60 bg-muted/30 p-3"
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <User className="size-3" />
                  {c.author}
                </span>
                <span className="font-mono text-muted-foreground tabular">
                  {formatClock(c.createdAt, false)}
                </span>
              </div>
              <p className="text-sm text-foreground/90">{c.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <p className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
            Aucun commentaire pour le moment.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Votre nom (ex. Laurent)"
          className="h-9 text-sm"
        />
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
            }}
            placeholder="Ajouter une note (ex. Drone impossible à cause du vent)…"
            className="min-h-[44px]"
          />
          <Button onClick={submit} size="icon" disabled={!text.trim()} aria-label="Envoyer">
            <Send />
          </Button>
        </div>
      </div>
    </div>
  )
}
