
from transformers import AutoTokenizer, VitsModel

MODEL_ID = "facebook/mms-tts-tam"

print("Downloading the Tamil voice model...")

AutoTokenizer.from_pretrained(MODEL_ID)
VitsModel.from_pretrained(MODEL_ID)

print("Tamil voice model downloaded successfully!")
