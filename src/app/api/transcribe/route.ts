import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pipeline } from "@xenova/transformers";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Cache the pipeline to avoid reloading the model
let transcriber: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getTranscriber() {
  if (!transcriber) {
    console.log("Loading Whisper model (first time may take a moment)...");
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-small",
      {
        quantized: true,
      }
    );
    console.log("Whisper model loaded!");
  }
  return transcriber;
}

// Convert audio to 16kHz mono Float32Array using ffmpeg
async function convertAudioToFloat32(audioBuffer: ArrayBuffer): Promise<Float32Array> {
  const tempId = Date.now();
  const inputPath = join(tmpdir(), `input_${tempId}.webm`);
  const outputPath = join(tmpdir(), `output_${tempId}.raw`);

  try {
    // Write input audio to temp file
    await writeFile(inputPath, Buffer.from(audioBuffer));

    // Convert to 16kHz mono PCM using ffmpeg
    await execAsync(
      `ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -f f32le "${outputPath}" 2>/dev/null`
    );

    // Read the raw PCM data
    const rawBuffer = await readFile(outputPath);
    const float32Array = new Float32Array(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.length / 4);

    return float32Array;
  } finally {
    // Cleanup temp files
    try {
      await unlink(inputPath);
      await unlink(outputPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const noteId = formData.get("noteId") as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();

    // Convert audio to Float32Array using ffmpeg
    console.log("Converting audio format...");
    const audioData = await convertAudioToFloat32(arrayBuffer);
    console.log(`Audio converted: ${audioData.length} samples`);

    // Get the transcriber (loads model on first call)
    const whisper = await getTranscriber();

    // Transcribe the audio
    console.log("Transcribing...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (whisper as any)(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: "english",
      task: "transcribe",
    });

    const transcription = typeof result === "string"
      ? result
      : (result as { text: string }).text || "";

    console.log("Transcription complete:", transcription.substring(0, 100) + "...");

    // Optionally store the audio recording reference in the database
    if (noteId) {
      // Upload audio to Supabase Storage
      const fileName = `${user.id}/${noteId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(fileName, audioFile);

      if (!uploadError) {
        // Create audio recording record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("audio_recordings").insert({
          user_id: user.id,
          note_id: noteId,
          storage_path: fileName,
          transcription,
          status: "completed",
          duration: null,
        });
      }
    }

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio. Make sure ffmpeg is installed." },
      { status: 500 }
    );
  }
}
