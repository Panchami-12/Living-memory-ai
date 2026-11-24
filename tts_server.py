import base64
import os
import traceback
from io import BytesIO
from pathlib import Path

import soundfile as sf
import torch
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, VitsModel


# =========================================================
# ENVIRONMENT AND GEMINI
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"

load_dotenv(BACKEND_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

gemini_client = (
    genai.Client(api_key=GEMINI_API_KEY)
    if GEMINI_API_KEY
    else None
)

GEMINI_TTS_MODEL = "gemini-3.8-flash-tts"
GEMINI_KANNADA_VOICE = "Kore"


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(title="Living Memory Voice Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# =========================================================
# LOCAL VOICE MODELS
# =========================================================

MODEL_IDS = {
    "Kannada": "facebook/mms-tts-kan",
    "Hindi": "facebook/mms-tts-hin",
    "Tamil": "facebook/mms-tts-tam",
    "Malayalam": "facebook/mms-tts-mal",
}

loaded_models = {}


# =========================================================
# REQUEST MODEL
# =========================================================

class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    language: str = "Kannada"


# =========================================================
# GEMINI KANNADA VOICE
# =========================================================

def generate_gemini_kannada(text: str) -> bytes:
    """Generate Kannada speech with Gemini and return WAV bytes."""

    if gemini_client is None:
        raise RuntimeError("Gemini API key is not configured.")

    prompt = f"""Speak the following text in natural, clear Kannada.

Use a warm, gentle and friendly voice.
Speak slowly and clearly for elderly listeners.
Read the supplied Kannada text verbatim.
Do not translate, summarize, explain, or add extra words.

Text to speak:
{text}
"""

    response = gemini_client.models.generate_content(
        model=GEMINI_TTS_MODEL,
        contents=text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=GEMINI_KANNADA_VOICE
                    )
                )
            ),
        ),
    )

    # Gemini 3.8 Flash TTS returns WAV audio in inline_data by default.
    for candidate in response.candidates or []:
        candidate_content = candidate.content
        if candidate_content is None:
            continue

        for part in candidate_content.parts or []:
            inline_data = part.inline_data
            if inline_data is None or not inline_data.data:
                continue

            audio_data = inline_data.data
            if isinstance(audio_data, str):
                audio_data = base64.b64decode(audio_data)

            mime_type = (inline_data.mime_type or "").lower()
            if mime_type and not mime_type.startswith("audio/"):
                raise RuntimeError(
                    f"Gemini returned unexpected media type: {mime_type}"
                )

            return bytes(audio_data)

    raise RuntimeError("Gemini did not return audio data.")


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/tts/health")
def health():
    return {
        "status": "healthy",
        "languages": list(MODEL_IDS.keys()),
        "mode": "Gemini Kannada with local voice fallback",
        "gemini_configured": gemini_client is not None,
        "gemini_model": GEMINI_TTS_MODEL,
    }


# =========================================================
# LOCAL VOICE GENERATION
# =========================================================

def generate_local_voice(text: str, language: str) -> bytes:
    """Generate WAV speech using the cached local MMS-TTS model."""

    if language not in MODEL_IDS:
        raise ValueError(f"Unsupported TTS language: {language}")

    if language not in loaded_models:
        model_id = MODEL_IDS[language]

        tokenizer = AutoTokenizer.from_pretrained(
            model_id,
            local_files_only=True,
        )

        model = VitsModel.from_pretrained(
            model_id,
            local_files_only=True,
        )

        model.eval()
        loaded_models[language] = (tokenizer, model)

    tokenizer, model = loaded_models[language]
    inputs = tokenizer(text, return_tensors="pt")

    inputs["input_ids"] = inputs["input_ids"].to(dtype=torch.long)

    if "attention_mask" in inputs:
     inputs["attention_mask"] = inputs["attention_mask"].to(dtype=torch.long)

    with torch.inference_mode():
     waveform = model(**inputs).waveform[0].detach().cpu().numpy()

    audio_buffer = BytesIO()
    sf.write(
        audio_buffer,
        waveform,
        model.config.sampling_rate,
        format="WAV",
    )

    return audio_buffer.getvalue()


# =========================================================
# SPEAK ENDPOINT
# =========================================================

@app.post("/tts/speak")
def speak(data: SpeechRequest):
    language = data.language.strip()
    text = data.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty.",
        )

    if language not in MODEL_IDS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Supported languages: Kannada, Hindi, Tamil and Malayalam."
            ),
        )

    # -----------------------------------------------------
    # GEMINI FOR KANNADA
    # -----------------------------------------------------

    if language == "Kannada" and gemini_client is not None:
        try:
            print("[TTS] Generating Kannada voice using Gemini")
            audio_bytes = generate_gemini_kannada(text)
            print("[TTS] Gemini Kannada voice generated successfully")

            return Response(
                content=audio_bytes,
                media_type="audio/wav",
                headers={"Cache-Control": "no-store"},
            )

        except Exception as error:
            print("[TTS] Gemini voice error:", error)
            print("[TTS] Switching to local Kannada voice")
            traceback.print_exc()

    # -----------------------------------------------------
    # LOCAL VOICE / FALLBACK
    # -----------------------------------------------------

    try:
        print(f"[TTS] Generating local {language} voice")
        audio_bytes = generate_local_voice(text, language)

        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"Cache-Control": "no-store"},
        )

    except Exception as error:
        print(f"[TTS] Local {language} TTS error:", error)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=(
                "Voice generation failed. Check the voice-server terminal."
            ),
        ) from error
