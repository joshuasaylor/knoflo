"use client";

import * as React from "react";
import { Button, Textarea } from "@/components/ui";
import { Send, Loader2, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyMode } from "@/types/database";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  noteId?: string;
  mode: StudyMode;
  initialMessages?: Message[];
}

export function ChatInterface({
  noteId,
  mode,
  initialMessages = [],
}: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    // Reset conversation when mode or noteId changes
    setMessages([]);
    setSessionId(null);

    // Send initial message based on mode
    const initialPrompts: Record<StudyMode, string> = {
      quiz: "I'm ready to quiz you! Let's start with the first question.",
      explain:
        "I'll help you understand your notes better. What would you like me to explain?",
      flashcard:
        "Let's study with flashcards! I'll show you terms one at a time. Ready for the first one?",
      general:
        "I'm here to help you study. Ask me anything about your notes!",
    };

    if (mode) {
      setMessages([{ role: "assistant", content: initialPrompts[mode] }]);
    }
  }, [mode, noteId]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          noteId,
          mode,
          sessionId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Add placeholder for assistant message
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.text) {
                assistantMessage += data.text;
                setMessages([
                  ...newMessages,
                  { role: "assistant", content: assistantMessage },
                ]);
              }

              if (data.sessionId) {
                setSessionId(data.sessionId);
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="rounded-lg bg-gray-100 px-4 py-2 dark:bg-gray-800">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <div className="mx-auto max-w-2xl">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
