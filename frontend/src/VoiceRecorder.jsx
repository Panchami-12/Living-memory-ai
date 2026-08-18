import { useRef, useState } from "react";

function VoiceRecorder({ onTextGenerated, onAudioRecorded }) {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // =========================================
      // GET MICROPHONE
      // =========================================
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // =========================================
      // AUDIO RECORDER
      // =========================================
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // Send audio to App.jsx
        if (onAudioRecorded) {
          onAudioRecorded(audioBlob);
        }

        // Stop microphone
        stream.getTracks().forEach((track) => track.stop());

        setStatus("✅ Voice recorded. Save the memory.");
      };

      mediaRecorder.start();

      // =========================================
      // SPEECH TO TEXT
      // =========================================
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();

        recognition.lang = "en-IN";
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          let text = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            text += event.results[i][0].transcript + " ";
          }

          if (text.trim() && onTextGenerated) {
            onTextGenerated(text.trim());
          }
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      setRecording(true);
      setStatus("🎤 Listening... Speak your memory.");
    } catch (error) {
      console.error("Microphone error:", error);

      setStatus("❌ Microphone permission is required.");
    }
  };

  const stopRecording = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop audio recording
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      mediaRecorderRef.current = null;
    }

    setRecording(false);
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
