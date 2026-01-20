"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useNotes } from "@/hooks/use-notes";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Button, Card, Skeleton } from "@/components/ui";
import type { StudyMode, Note } from "@/types/database";
import {
  Brain,
  BookOpen,
  CreditCard,
  MessageSquare,
  FileText,
  ChevronRight,
  FolderOpen,
} from "lucide-react";

const STUDY_MODES: Array<{
  id: StudyMode;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}> = [
  {
    id: "quiz",
    name: "Quiz Mode",
    description: "Test your knowledge with questions based on your notes",
    icon: Brain,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
  },
  {
    id: "explain",
    name: "Explain Mode",
    description: "Get detailed explanations of concepts in your notes",
    icon: BookOpen,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
  },
  {
    id: "flashcard",
    name: "Flashcard Mode",
    description: "Practice with flashcard-style Q&A sessions",
    icon: CreditCard,
    color: "text-green-600 bg-green-100 dark:bg-green-900/20",
  },
  {
    id: "general",
    name: "General Q&A",
    description: "Ask any questions about your study material",
    icon: MessageSquare,
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
  },
];

export default function StudyPage() {
  const searchParams = useSearchParams();
  const { notes, folders, isLoading } = useNotes();
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null);
  const [selectedMode, setSelectedMode] = React.useState<StudyMode | null>(null);
  const [showChat, setShowChat] = React.useState(false);
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null);

  const filteredNotes = React.useMemo(() => {
    if (!selectedFolder) return notes;
    return notes.filter((note) => note.folder_id === selectedFolder);
  }, [notes, selectedFolder]);

  // Check for note ID in URL params
  React.useEffect(() => {
    const noteId = searchParams.get("noteId");
    if (noteId && notes.length > 0) {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        setSelectedNote(note);
      }
    }
  }, [searchParams, notes]);

  const handleStartStudy = () => {
    if (selectedNote && selectedMode) {
      setShowChat(true);
    }
  };

  const handleBack = () => {
    setShowChat(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (showChat && selectedNote && selectedMode) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              Back
            </Button>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
            <div>
              <p className="text-sm font-medium">
                {STUDY_MODES.find((m) => m.id === selectedMode)?.name}
              </p>
              <p className="text-xs text-gray-500">{selectedNote.title}</p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface noteId={selectedNote.id} mode={selectedMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Study Mode
      </h1>

      {/* Step 1: Select Note */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          1. Select a note to study
        </h2>

        {/* Folder Filter */}
        {folders.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                !selectedFolder
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              All Notes
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  selectedFolder === folder.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {folder.name}
              </button>
            ))}
          </div>
        )}

        {filteredNotes.length === 0 ? (
          <Card className="p-6 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-gray-500">
              {notes.length === 0
                ? "You don't have any notes yet. Create some notes first to start studying!"
                : "No notes in this folder."}
            </p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.slice(0, 9).map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  selectedNote?.id === note.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {note.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {note.plain_text || "No content"}
                    </p>
                  </div>
                  {selectedNote?.id === note.id && (
                    <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Select Study Mode */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          2. Choose a study mode
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STUDY_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              disabled={!selectedNote}
              className={`rounded-lg border p-4 text-left transition-all ${
                !selectedNote
                  ? "cursor-not-allowed opacity-50"
                  : selectedMode === mode.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
              }`}
            >
              <div
                className={`mb-3 inline-flex rounded-lg p-2 ${mode.color}`}
              >
                <mode.icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {mode.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartStudy}
          disabled={!selectedNote || !selectedMode}
          size="lg"
          className="gap-2"
        >
          Start Studying
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
