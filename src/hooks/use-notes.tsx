"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { Note, Folder, Json } from "@/types/database";

export function useNotes() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [folders, setFolders] = React.useState<Folder[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const supabase = React.useMemo(() => createClient(), []);
  const hasLoadedRef = React.useRef(false);

  const fetchNotes = React.useCallback(async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });
    setNotes((data as Note[]) || []);
  }, [supabase]);

  const fetchFolders = React.useCallback(async () => {
    const { data } = await supabase
      .from("folders")
      .select("*")
      .order("name", { ascending: true });
    setFolders((data as Folder[]) || []);
  }, [supabase]);

  React.useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchNotes(), fetchFolders()]);
      setIsLoading(false);
    };
    load();
  }, [fetchNotes, fetchFolders]);

  const createNote = async (folderId?: string): Promise<Note | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("notes")
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        title: "Untitled Note",
        content: {},
        plain_text: "",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating note:", error);
      return null;
    }

    const note = data as Note;
    setNotes((prev) => [note, ...prev]);
    return note;
  };

  const updateNote = async (
    id: string,
    updates: { title?: string; content?: Json; plain_text?: string; folder_id?: string | null; is_favorite?: boolean }
  ): Promise<Note | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("notes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating note:", error);
      return null;
    }

    const note = data as Note;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? note : n))
    );
    return note;
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);

    if (error) {
      console.error("Error deleting note:", error);
      return false;
    }

    setNotes((prev) => prev.filter((note) => note.id !== id));
    return true;
  };

  const getNote = async (id: string): Promise<Note | null> => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching note:", error);
      return null;
    }

    return data as Note;
  };

  const searchNotes = async (query: string): Promise<void> => {
    if (!query.trim()) {
      await fetchNotes();
      return;
    }

    const { data } = await supabase
      .from("notes")
      .select("*")
      .or(`title.ilike.%${query}%,plain_text.ilike.%${query}%`)
      .order("updated_at", { ascending: false });

    setNotes((data as Note[]) || []);
  };

  const createFolder = async (name: string, parentId?: string): Promise<Folder | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("folders")
      .insert({
        user_id: user.id,
        name,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating folder:", error);
      return null;
    }

    const folder = data as Folder;
    setFolders((prev) => [...prev, folder]);
    return folder;
  };

  const updateFolder = async (id: string, name: string): Promise<Folder | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("folders")
      .update({ name })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating folder:", error);
      return null;
    }

    const folder = data as Folder;
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? folder : f))
    );
    return folder;
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from("folders").delete().eq("id", id);

    if (error) {
      console.error("Error deleting folder:", error);
      return false;
    }

    setFolders((prev) => prev.filter((folder) => folder.id !== id));
    return true;
  };

  return {
    notes,
    folders,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    searchNotes,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: fetchNotes,
  };
}
