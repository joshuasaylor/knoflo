import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });

    return transcription;
  } catch (error) {
    console.error("Whisper transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}
