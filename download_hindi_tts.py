
from transformers import AutoTokenizer, VitsModel

MODEL_ID = "facebook/mms-tts-hin"

print("Downloading the Hindi voice model...")

AutoTokenizer.from_pretrained(MODEL_ID)
VitsModel.from_pretrained(MODEL_ID)

print("Hindi voice model downloaded successfully!")
