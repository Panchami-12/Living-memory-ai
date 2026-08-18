import json
import urllib.request
import urllib.error


OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "gemma3:latest"


def ask_ai(prompt: str) -> str:

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False
    }

    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        OLLAMA_URL,
        data=data,
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=120) as response:

            result = json.loads(
                response.read().decode("utf-8")
            )

            return result.get(
                "response",
                "I couldn't generate a response."
            )

    except urllib.error.URLError as error:

        print("OLLAMA CONNECTION ERROR:", error)

        raise Exception(
            f"Cannot connect to Ollama: {error}"
        )

    except Exception as error:

        print("OLLAMA ERROR:", error)

        raise