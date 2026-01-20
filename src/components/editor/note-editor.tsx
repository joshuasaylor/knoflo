"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Toolbar } from "./toolbar";
import type { Json } from "@/types/database";

interface NoteEditorProps {
  content?: Json;
  onChange?: (content: Json, plainText: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export function NoteEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing your notes...",
}: NoteEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-yellow-200 dark:bg-yellow-800",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: content as Record<string, unknown> | undefined,
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      onChange?.(json as Json, text);
    },
  });

  // Only set content once when editor is ready and content is provided initially
  const hasSetInitialContent = React.useRef(false);
  React.useEffect(() => {
    if (editor && content && !hasSetInitialContent.current) {
      editor.commands.setContent(content as Record<string, unknown>);
      hasSetInitialContent.current = true;
    }
  }, [editor, content]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
