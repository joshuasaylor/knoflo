"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotes } from "@/hooks/use-notes";
import { Button, Card, Skeleton } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Star,
  MoreVertical,
  Trash2,
  Edit,
  FolderOpen,
  FolderPlus,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";

export default function NotesPage() {
  const router = useRouter();
  const { notes, folders, isLoading, createNote, updateNote, deleteNote, createFolder } =
    useNotes();
  const [filter, setFilter] = React.useState<"all" | "favorites">("all");
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
    }
  };

  const [draggedNoteId, setDraggedNoteId] = React.useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(folderId);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    if (draggedNoteId) {
      await updateNote(draggedNoteId, { folder_id: folderId });
    }
    setDraggedNoteId(null);
    setDragOverFolderId(null);
  };

  const handleCreateNote = async () => {
    const note = await createNote(selectedFolder || undefined);
    if (note) {
      router.push(`/notes/${note.id}`);
    }
  };

  const handleToggleFavorite = async (
    e: React.MouseEvent,
    noteId: string,
    currentStatus: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    await updateNote(noteId, { is_favorite: !currentStatus });
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
    }
  };

  const filteredNotes = React.useMemo(() => {
    let result = notes;

    if (filter === "favorites") {
      result = result.filter((note) => note.is_favorite);
    }

    if (selectedFolder) {
      result = result.filter((note) => note.folder_id === selectedFolder);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          (note.plain_text && note.plain_text.toLowerCase().includes(query))
      );
    }

    return result;
  }, [notes, filter, selectedFolder, searchQuery]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Folders sidebar */}
      <aside className="hidden w-48 flex-shrink-0 border-r border-gray-200 p-4 dark:border-gray-800 lg:block">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Folders
          </h3>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            title="New Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>

        {isCreatingFolder && (
          <div className="mb-2 flex items-center gap-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") setIsCreatingFolder(false);
              }}
              placeholder="Folder name"
              autoFocus
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
            />
            <button
              onClick={handleCreateFolder}
              className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName("");
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav className="space-y-1">
          <button
            onClick={() => setSelectedFolder(null)}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={(e) => handleDrop(e, null)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
              dragOverFolderId === null && draggedNoteId
                ? "bg-blue-100 ring-2 ring-blue-400 dark:bg-blue-900/40"
                : !selectedFolder
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <FileText className="h-4 w-4" />
            All Notes
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={() => setDragOverFolderId(null)}
              onDrop={(e) => handleDrop(e, folder.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                dragOverFolderId === folder.id
                  ? "bg-blue-100 ring-2 ring-blue-400 dark:bg-blue-900/40"
                  : selectedFolder === folder.id
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              {folder.name}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selectedFolder
                ? folders.find((f) => f.id === selectedFolder)?.name
                : "All Notes"}
            </h1>
            <p className="text-sm text-gray-500">
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1 ? "note" : "notes"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-48 rounded-md border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex rounded-md border border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-sm ${
                  filter === "all"
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("favorites")}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm ${
                  filter === "favorites"
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-900"
                }`}
              >
                <Star className="h-3.5 w-3.5" />
                Favorites
              </button>
            </div>
            <Button onClick={handleCreateNote}>
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              No notes yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first note to get started
            </p>
            <Button onClick={handleCreateNote} className="mt-4">
              <Plus className="h-4 w-4" />
              Create Note
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                draggable
                onDragStart={(e) => handleDragStart(e, note.id)}
                onDragEnd={handleDragEnd}
                className={`${draggedNoteId === note.id ? "opacity-50" : ""}`}
              >
              <Link href={`/notes/${note.id}`}>
                <Card className="group h-full cursor-pointer transition-shadow hover:shadow-md">
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {note.title || "Untitled Note"}
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) =>
                            handleToggleFavorite(e, note.id, note.is_favorite)
                          }
                          className={`rounded p-1 ${
                            note.is_favorite
                              ? "text-yellow-500"
                              : "text-gray-400 opacity-0 group-hover:opacity-100"
                          } hover:bg-gray-100 dark:hover:bg-gray-800`}
                        >
                          <Star
                            className="h-4 w-4"
                            fill={note.is_favorite ? "currentColor" : "none"}
                          />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.preventDefault()}
                              className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 group-hover:opacity-100 dark:hover:bg-gray-800"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                router.push(`/notes/${note.id}`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteNote(e, note.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {note.plain_text || "No content"}
                    </p>
                    <p className="mt-3 text-xs text-gray-400">
                      {formatDate(note.updated_at)}
                    </p>
                  </div>
                </Card>
              </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
