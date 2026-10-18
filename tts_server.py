
from io import BytesIO

import soundfile as sf
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, VitsModel

app = FastAPI(title="Living Memory Local Voice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)



MODEL_IDS = {
    "Kannada": "facebook/mms-tts-kan",
    "Hindi": "facebook/mms-tts-hin",
    "Tamil": "facebook/mms-tts-tam",
    "Malayalam": "facebook/mms-tts-mal",
}


loaded_models = {}


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    language: str = "Kannada"


@app.get("/tts/health")
def health():
    return {
        "status": "healthy",
        "languages": list(MODEL_IDS.keys()),
        "mode": "local",
    }


@app.post("/tts/speak")
def speak(data: SpeechRequest):
    language = data.language.strip()

    if language not in MODEL_IDS:
        raise HTTPException(
            status_code=400,
            detail="Currently supported local languages: Kannada and Hindi.",
        )

    try:
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
        inputs = tokenizer(data.text, return_tensors="pt")

        with torch.inference_mode():
            waveform = model(**inputs).waveform[0].cpu().numpy()

        audio_buffer = BytesIO()
        sf.write(
            audio_buffer,
            waveform,
            model.config.sampling_rate,
            format="WAV",
        )

        return Response(
            content=audio_buffer.getvalue(),
            media_type="audio/wav",
            headers={"Cache-Control": "no-store"},
        )

    except Exception as error:
        print(f"Local {language} TTS error:", error)
        raise HTTPException(
            status_code=500,
            detail="Local voice generation failed. Check the voice-server terminal.",
        ) from error
