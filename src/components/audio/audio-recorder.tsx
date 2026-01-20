"use client";

import * as React from "react";
import { Button } from "@/components/ui";
import { Mic, Square, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  noteId: string;
  onTranscriptionComplete: (transcription: string) => void;
  onClose: () => void;
}

type RecordingState = "idle" | "recording" | "processing";

export function AudioRecorder({
  noteId,
  onTranscriptionComplete,
  onClose,
}: AudioRecorderProps) {
  const [state, setState] = React.useState<RecordingState>("idle");
  const [duration, setDuration] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [audioLevel, setAudioLevel] = React.useState(0);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analysis for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Visualize audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Clean up
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        analyserRef.current = null;

        // Process recording
        await processRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      setState("recording");

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError("Could not access microphone. Please check permissions.");
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setState("processing");
    }
  };

  const processRecording = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: audioChunksRef.current[0]?.type || "audio/webm",
      });

      // Create form data for API
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("noteId", noteId);

      // Send to transcription API
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const { transcription } = await response.json();
      onTranscriptionComplete(transcription);
    } catch (err) {
      setError("Failed to transcribe audio. Please try again.");
      console.error("Error processing recording:", err);
      setState("idle");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaRecorderRef.current && state === "recording") {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [state]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Recording indicator */}
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              state === "recording"
                ? "bg-red-100 dark:bg-red-900/20"
                : state === "processing"
                ? "bg-blue-100 dark:bg-blue-900/20"
                : "bg-gray-100 dark:bg-gray-800"
            )}
          >
            {state === "recording" ? (
              <div className="relative">
                <Mic className="h-6 w-6 text-red-600" />
                <span
                  className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-red-500"
                  style={{
                    transform: `scale(${0.8 + audioLevel * 0.4})`,
                  }}
                />
              </div>
            ) : state === "processing" ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            ) : (
              <Mic className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            )}
          </div>

          {/* Status and time */}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {state === "idle" && "Ready to record"}
              {state === "recording" && "Recording..."}
              {state === "processing" && "Transcribing..."}
            </p>
            {state !== "idle" && (
              <p className="text-sm text-gray-500">{formatTime(duration)}</p>
            )}
          </div>

          {/* Audio level visualization */}
          {state === "recording" && (
            <div className="flex items-center gap-0.5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-4 w-1 rounded-full transition-all",
                    i < audioLevel * 10
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                  style={{
                    height: `${8 + (i < audioLevel * 10 ? audioLevel * 16 : 0)}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {state === "idle" && (
            <Button onClick={startRecording} className="gap-2">
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          )}
          {state === "recording" && (
            <Button onClick={stopRecording} variant="destructive" className="gap-2">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          )}
          {state === "idle" && (
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Help text */}
      {state === "idle" && !error && (
        <p className="mt-3 text-sm text-gray-500">
          Click to start recording. Your audio will be automatically transcribed
          and added to your note.
        </p>
      )}
    </div>
  );
}
