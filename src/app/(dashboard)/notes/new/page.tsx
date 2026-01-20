"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Note } from "@/types/database";

export default function NewNotePage() {
  const router = useRouter();
  const hasCreatedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasCreatedRef.current) return;
    hasCreatedRef.current = true;

    const createNewNote = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notes")
        .insert({
          user_id: user.id,
          title: "Untitled Note",
          content: {},
          plain_text: "",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating note:", error);
        router.push("/notes");
        return;
      }

      const note = data as Note;
      router.replace(`/notes/${note.id}`);
    };

    createNewNote();
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
