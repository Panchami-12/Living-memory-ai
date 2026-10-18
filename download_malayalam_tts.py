
from transformers import AutoTokenizer, VitsModel

MODEL_ID = "facebook/mms-tts-mal"

print("Downloading the Malayalam voice model...")

AutoTokenizer.from_pretrained(MODEL_ID)
VitsModel.from_pretrained(MODEL_ID)

print("Malayalam voice model downloaded successfully!")
