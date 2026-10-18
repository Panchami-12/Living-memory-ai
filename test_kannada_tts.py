
import torch
import soundfile as sf
from transformers import AutoTokenizer, VitsModel

MODEL_ID = "facebook/mms-tts-kan"

print("Loading Kannada voice model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = VitsModel.from_pretrained(MODEL_ID)
model.eval()

text = "ನಿಮ್ಮ ಅಪ್ಪನಿಗೆ ಇಡ್ಲಿ ತುಂಬಾ ಇಷ್ಟವಾಗಿತ್ತು."

print("Generating Kannada speech...")

inputs = tokenizer(text, return_tensors="pt")

with torch.no_grad():
    output = model(**inputs).waveform

audio = output.squeeze().cpu().numpy()

sf.write(
    "kannada_test.wav",
    audio,
    model.config.sampling_rate
)

print("Success! Audio saved as kannada_test.wav")
