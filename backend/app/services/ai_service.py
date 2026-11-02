import json
import urllib.request
import urllib.error


OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL = "qwen2.5:7b"


SYSTEM_INSTRUCTIONS = """
You are Living Memory AI, a multilingual personal memory assistant.

Follow the MANDATORY OUTPUT LANGUAGE specified in the user's prompt.

Language rules:
- English: answer in English.
- Kannada: answer entirely in Kannada script (ಕನ್ನಡ).
- Hindi: answer entirely in Devanagari script (हिन्दी).
- Tamil: answer entirely in Tamil script (தமிழ்).
- Malayalam: answer entirely in Malayalam script (മലയാളം).

Never mix languages in the same answer.
Never write Kannada, Hindi, Tamil, or Malayalam words
using English letters.
Use the selected language's native script throughout.
Keep personal names unchanged when appropriate.

Use only information supported by the retrieved memories.
Never invent personal facts or guess missing information.
If the requested information is unavailable, say so
in the selected language.
Return only the answer, without language explanations
or an English translation.
"""


LANGUAGE_RULES = {
    "English": (
        "Answer entirely in natural English using Latin script. "
        "Translate Kannada, Hindi, Tamil and Malayalam words into "
        "English. Write ಇಡ್ಲಿ as idli. Never copy non-English "
        "scripts into an English answer."
    ),

    "Kannada": (
    "Answer entirely in natural, grammatically correct Kannada "
    "using Kannada script only. Never use English letters. "
    "Use simple everyday Kannada. "
    "If Mom's favourite food is dosa, answer: "
    "ನನ್ನ ಅಮ್ಮನಿಗೆ ಇಷ್ಟವಾದ ಆಹಾರ ದೋಸೆ. "
    "If Father's favourite food is idli, answer: "
    "ನನ್ನ ಅಪ್ಪನಿಗೆ ಇಷ್ಟವಾದ ಆಹಾರ ಇಡ್ಲಿ. "
    "If Father's favourite sweet is gulab jamun, answer: "
    "ನನ್ನ ಅಪ್ಪನಿಗೆ ಇಷ್ಟವಾದ ಸಿಹಿ ಗುಲಾಬ್ ಜಾಮೂನ್. "
    "Always write gulab jamun as ಗುಲಾಬ್ ಜಾಮೂನ್. "
    "Do not change the sweet's name. "
    "Return only one short Kannada answer."
),

    "Hindi": (
    "Answer entirely in natural, grammatically correct Hindi "
    "using Devanagari script ONLY. Never use Latin letters. "
    "Use simple everyday Hindi. "
    "If Mother's favourite food is dosa, answer: "
    "मेरी माँ का पसंदीदा खाना डोसा है। "
    "If Father's favourite food is idli, answer: "
    "मेरे पापा का पसंदीदा खाना इडली है। "
    "If Father's favourite sweet is gulab jamun, answer: "
    "मेरे पापा की पसंदीदा मिठाई गुलाब जामुन है। "
    "Always write idli as इडली and gulab jamun as गुलाब जामुन. "
    "Return only one short, natural Hindi answer."
),

   "Tamil": (
    "Answer entirely in natural, grammatically correct Tamil "
    "using Tamil script only. Never use English letters. "
    "Use simple everyday Tamil. "
    "If Mom's favourite food is dosa, answer: "
    "என் அம்மாவுக்குப் பிடித்த உணவு தோசை. "
    "If Father's favourite food is idli, answer: "
    "என் அப்பாவுக்குப் பிடித்த உணவு இட்லி. "
    "If Father's favourite sweet is gulab jamun, answer: "
    "என் அப்பாவுக்குப் பிடித்த இனிப்பு குலாப் ஜாமுன். "
    "Always write gulab jamun as குலாப் ஜாமுன். "
    "Do not change or invent the sweet's name. "
    "Return only one short, natural Tamil answer."
),

    "Malayalam": (
    "Answer entirely in natural, grammatically correct Malayalam "
    "using Malayalam script. Translate the meaning of the memory "
    "naturally, not word by word. Use simple, everyday Malayalam. "
    "For example, if Mom's favourite food is dosa, answer: "
    "അമ്മയുടെ പ്രിയപ്പെട്ട ഭക്ഷണം ദോശയാണ്. "
    "If Father's favourite food is idli, answer: "
    "അച്ഛന്റെ പ്രിയപ്പെട്ട ഭക്ഷണം ഇഡ്ലിയാണ്. "
    "If Father's favourite sweet is gulab jamun, answer: "
    "അച്ഛന്റെ പ്രിയപ്പെട്ട മധുരം ഗുലാബ് ജാമുനാണ്. "
    "Never produce awkward literal translations. "
    "Return only one short, natural Malayalam answer."
),
}


def ask_ai(prompt: str, language: str = "English") -> str:

    language_rule = LANGUAGE_RULES.get(
        language,
        LANGUAGE_RULES["English"],
    )

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    SYSTEM_INSTRUCTIONS
                    + "\n"
                    + language_rule
                    + "\nReturn only the final answer. "
                    "Do not show reasoning or analysis."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 512,
        },
    }

    request = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=300,
        ) as response:

            result = json.loads(
                response.read().decode("utf-8")
            )

        message = result.get("message", {})
        answer = message.get("content", "").strip()

        if not answer:
            print("OLLAMA returned an empty final answer.")
            return "I couldn't generate a response."

        # Return the answer directly.
        # No second translation request is performed.
        return answer

    except urllib.error.URLError as error:
        print("OLLAMA CONNECTION ERROR:", error)

        raise Exception(
            f"Cannot connect to Ollama: {error}"
        ) from error

    except Exception as error:
        print("OLLAMA ERROR:", error)
        raise