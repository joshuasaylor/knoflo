"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useNotes } from "@/hooks/use-notes";
import { NoteEditor } from "@/components/editor/note-editor";
import { AudioRecorder } from "@/components/audio/audio-recorder";
import { Button, Skeleton } from "@/components/ui";
import { debounce } from "@/lib/utils";
import type { Note, Json } from "@/types/database";
import {
  ArrowLeft,
  Star,
  Trash2,
  Mic,
  X,
  Check,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const { getNote, updateNote, deleteNote } = useNotes();
  const [note, setNote] = React.useState<Note | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showRecorder, setShowRecorder] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const noteId = params.id as string;

  const hasLoadedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadNote = async () => {
      if (noteId === "new") {
        router.replace("/notes/new");
        return;
      }

      const fetchedNote = await getNote(noteId);
      if (fetchedNote) {
        setNote(fetchedNote);
        setTitle(fetchedNote.title);
      } else {
        router.push("/notes");
      }
      setIsLoading(false);
      hasLoadedRef.current = true;
    };

    loadNote();
  }, [noteId, getNote, router]);

  const debouncedSaveContent = React.useMemo(
    () =>
      debounce(async (id: string, content: Json, plainText: string) => {
        setIsSaving(true);
        await updateNote(id, { content, plain_text: plainText });
        setLastSaved(new Date());
        setIsSaving(false);
      }, 1000),
    [updateNote]
  );

  const debouncedSaveTitle = React.useMemo(
    () =>
      debounce(async (id: string, newTitle: string) => {
        setIsSaving(true);
        await updateNote(id, { title: newTitle });
        setLastSaved(new Date());
        setIsSaving(false);
      }, 500),
    [updateNote]
  );

  const handleContentChange = (content: Json, plainText: string) => {
    if (note) {
      debouncedSaveContent(note.id, content, plainText);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (note) {
      debouncedSaveTitle(note.id, newTitle);
    }
  };

  const handleToggleFavorite = async () => {
    if (note) {
      const updated = await updateNote(note.id, {
        is_favorite: !note.is_favorite,
      });
      if (updated) {
        setNote(updated);
      }
    }
  };

  const handleDelete = async () => {
    if (note && confirm("Are you sure you want to delete this note?")) {
      await deleteNote(note.id);
      router.push("/notes");
    }
  };

  const handleTranscriptionComplete = async (transcription: string) => {
    if (note) {
      // Append transcription to the current content
      const currentText = note.plain_text || "";
      const newText = currentText
        ? `${currentText}\n\n--- Audio Transcription ---\n${transcription}`
        : transcription;

      // Create simple content with the transcription
      const existingContent = (note.content as { content?: Json[] })?.content || [];
      const newContent: Json = {
        type: "doc",
        content: [
          ...existingContent,
          {
            type: "paragraph",
            content: [{ type: "text", text: "\n\n--- Audio Transcription ---" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: transcription }],
          },
        ],
      };

      await updateNote(note.id, {
        content: newContent,
        plain_text: newText,
      });

      // Refresh the note
      const updated = await getNote(note.id);
      if (updated) {
        setNote(updated);
      }
    }
    setShowRecorder(false);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Skeleton className="mb-4 h-10 w-32" />
        <Skeleton className="mb-6 h-12 w-3/4" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/notes")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notes
        </Button>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="flex items-center gap-1 text-sm text-gray-500">
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </>
              )}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowRecorder(!showRecorder)}
            className={showRecorder ? "text-red-500" : ""}
          >
            {showRecorder ? (
              <X className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className={note.is_favorite ? "text-yellow-500" : ""}
          >
            <Star
              className="h-5 w-5"
              fill={note.is_favorite ? "currentColor" : "none"}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Audio recorder */}
      {showRecorder && (
        <div className="mb-6">
          <AudioRecorder
            noteId={note.id}
            onTranscriptionComplete={handleTranscriptionComplete}
            onClose={() => setShowRecorder(false)}
          />
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Untitled Note"
        className="mb-4 w-full border-0 bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100"
      />

      {/* Editor */}
      <NoteEditor
        content={note.content}
        onChange={handleContentChange}
        placeholder="Start writing your notes..."
      />
    </div>
  );
}
