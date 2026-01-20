import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSystemPrompt } from "@/lib/anthropic/claude";
import type { StudyMode, Note, ChatSession } from "@/types/database";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, noteId, mode, sessionId } = await request.json();

    // Get note content if noteId is provided
    let noteContent = "";
    if (noteId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("notes")
        .select("plain_text, title")
        .eq("id", noteId)
        .single();

      const note = data as Pick<Note, "plain_text" | "title"> | null;
      if (note) {
        noteContent = `Title: ${note.title}\n\n${note.plain_text}`;
      }
    }

    const systemPrompt = getSystemPrompt(mode as StudyMode, noteContent);

    // Create or update chat session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: session } = await (supabase as any)
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          note_id: noteId || null,
          mode: mode || "general",
        })
        .select()
        .single();

      currentSessionId = (session as ChatSession | null)?.id;
    }

    // Save user message
    if (currentSessionId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("chat_messages").insert({
          session_id: currentSessionId,
          role: "user",
          content: lastMessage.content,
        });
      }
    }

    // Build messages array for Ollama
    const ollamaMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Stream response from Ollama
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: OLLAMA_MODEL,
              messages: ollamaMessages,
              stream: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter((line) => line.trim());

            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                  const text = json.message.content;
                  fullResponse += text;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                  );
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }

          // Save assistant message after streaming completes
          if (currentSessionId && fullResponse) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("chat_messages").insert({
              session_id: currentSessionId,
              role: "assistant",
              content: fullResponse,
            });
          }

          // Send session ID with the final message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, sessionId: currentSessionId })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Failed to generate response. Make sure Ollama is running." })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
