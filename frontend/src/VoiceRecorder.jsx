import { useRef, useState } from "react";

const API = "http://127.0.0.1:8001";

function VoiceRecorder({ onTextGenerated, onAudioRecorded }) {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        stream.getTracks().forEach((track) => track.stop());

        if (onAudioRecorded) {
          onAudioRecorded(audioBlob);
        }

        if (!audioBlob.size) {
          setStatus("❌ No audio was recorded. Please try again.");
          return;
        }

        setStatus("⏳ Transcribing your recording...");

        try {
          const formData = new FormData();

          formData.append("audio", audioBlob, "recording.webm");

          const response = await fetch(`${API}/memories/transcribe`, {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.detail || "Transcription request failed.");
          }

          const transcript = result.text?.trim();

          if (transcript) {
            if (onTextGenerated) {
              onTextGenerated(transcript);
            }

            setStatus(`✅ Transcript added: ${transcript}`);
          } else {
            setStatus(
              "No speech detected. Please speak clearly and try again.",
            );
          }
        } catch (error) {
          console.error("Transcription error:", error);

          setStatus(`❌ Transcription failed: ${error.message}`);
        }
      };

      mediaRecorder.start();

      setRecording(true);
      setStatus("🎤 Recording... Speak clearly, then press Stop.");
    } catch (error) {
      console.error("Recording error:", error);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setRecording(false);
      setStatus("❌ Could not start recording. Check microphone permissions.");
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    mediaRecorderRef.current = null;
    setRecording(false);
    setStatus("⏳ Recording stopped. Preparing your transcript...");
  };

  return (
    <div className="voice-recorder">
      {!recording ? (
        <button type="button" className="voice-button" onClick={startRecording}>
          🎤 Record Memory
        </button>
      ) : (
        <button
          type="button"
          className="voice-button recording"
          onClick={stopRecording}
        >
          ⏹️ Stop Recording
        </button>
      )}

      {status && <p className="voice-status">{status}</p>}
    </div>
  );
}

export default VoiceRecorder;
