import { apiFetch } from "./apiFetch";
import { AuthenticatedImage, AuthenticatedAudio } from "./AuthenticatedMedia";
import { useEffect, useRef, useState } from "react";
import VoiceRecorder from "./VoiceRecorder";
import "./GrandparentsMode.css";

const TTS_API = import.meta.env.VITE_TTS_API_URL || "http://127.0.0.1:8002";
const grandparentsTranslations = {
  English: {
    welcomeTitle: "Welcome to your memory home",
    welcomeGreeting: "Hello, Grandma and Grandpa",
    welcomeSubtitle: "Preserve your family's precious memories",
    askSearching: "Searching your saved memories for an answer...",
    loadErrorStatus: "Could not load memories. Please try again.",
    memoriesReadySuffix: "'s memories are ready ❤️",
    askTitle: "Ask questions about your memories",
    viewerLabel: "Who is viewing these memories?",
    selectViewer: "Select the person viewing",
    viewerHelp:
      "Choose the person currently using the app. This controls which memories are hidden from the list and AI answers.",
    askButton: "Ask a Question",
    questionRecognized: "Question recognized",
    pleaseWait: "Please wait...",
    searching: "Looking through your family memories...",
    youSaid: "You said",
    yourAnswer: "Your answer ❤️",
    answerReady: "Your answer is ready. Listen to the voice.",
    answerReadyToListen: "Your answer is ready to listen ❤️",
    answerError: "Sorry, I could not get an answer. Please try again.",
    selectViewerFirst: "Please select who is viewing the memories first.",
    selectQuestionViewer:
      "Please select who is asking the question before using memory AI.",
    noProfilePrefix: "No",
    noProfileSuffix: "profile found.",
    loadMemoriesError: "Could not load family memories.",
    imageFormatError: "Please select a JPG, PNG, WEBP or GIF image.",
    transcriptSaved: "Your spoken memory has been transcribed ❤️",
    photoUploadError: "Photo upload failed.",
    audioUploadError: "Voice upload failed.",
    memoryTitleRequired: "Please enter a memory title.",
    memoryContentRequired: "Please speak or write your memory.",
    loginRequired: "Please login first.",
    saveMemoryError: "Could not save memory.",
    saveSuccess: "Memory, photo and voice saved successfully! ❤️",
    addMemoryTitle: "💝 Add a new family memory",
    addMemorySubtitle: "Add a new family memory",
    memoryTitle: "Memory title",
    memoryTitlePlaceholder: "Example: My childhood memories",
    whoseMemory: "Whose memory is this?",
    generalMemory: "General family memory",
    hideMemory: "🔒 Hide this memory from",
    hideHelp:
      "Select the family profiles that should not see this memory. Leave all unchecked to make it visible to everyone.",
    noProfiles: "No family profiles are available.",
    memoryType: "Memory type",
    personal: "Personal",
    family: "Family",
    childhood: "Childhood",
    story: "Story",
    experience: "Experience",
    travel: "Travel",
    writeMemory: "Write your memory",
    writePlaceholder: "Write your memory here...",
    orTellMemory: "Or tell your memory",
    recordMemory: "Record a Memory",
    memoryTranscript: "Memory transcript",
    audioAttached: "🎧 Original voice recording attached.",
    attachPhoto: "Attach a family photo",
    selected: "📸 Selected:",
    saving: "Saving memory...",
    saveButton: "❤️ Save My Memory",
    familyMemories: "❤️ My Family Memories",
    browseDescription: "Choose a family member to explore their memories.",
    profileMemoriesSuffix: "'s memories",
    memoriesSuffix: "'s Memories ❤️",
    noSavedMemories: "No saved memories found.",
    audioFallback: "Your browser does not support audio.",
    familyMemoryCount: "Your family memories",
  },
  Kannada: {
    welcomeTitle: "ನಿಮ್ಮ ನೆನಪುಗಳ ಮನೆಗೆ ಸ್ವಾಗತ",
    welcomeGreeting: "ನಮಸ್ಕಾರ ಅಜ್ಜ ಮತ್ತು ಅಜ್ಜಿ",
    welcomeSubtitle: "ನಿಮ್ಮ ಕುಟುಂಬದ ಅಮೂಲ್ಯ ನೆನಪುಗಳನ್ನು ಉಳಿಸಿ",
    askSearching: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರ ಹುಡುಕುತ್ತಿದ್ದೇನೆ...",
    loadErrorStatus: "ನೆನಪುಗಳನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    memoriesReadySuffix: " ಅವರ ನೆನಪುಗಳು ಸಿದ್ಧವಾಗಿವೆ ❤️",
    askTitle: "ನಿಮ್ಮ ನೆನಪುಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ",
    viewerLabel: "ಈ ನೆನಪುಗಳನ್ನು ಯಾರು ನೋಡುತ್ತಿದ್ದಾರೆ?",
    selectViewer: "ನೋಡುವ ವ್ಯಕ್ತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    viewerHelp:
      "ಈಗ ಆ್ಯಪ್ ಬಳಸುತ್ತಿರುವ ವ್ಯಕ್ತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಈ ಆಯ್ಕೆ ಯಾವ ನೆನಪುಗಳನ್ನು ಪಟ್ಟಿಯಿಂದ ಮತ್ತು AI ಉತ್ತರಗಳಿಂದ ಮರೆಮಾಡಬೇಕು ಎಂಬುದನ್ನು ನಿಯಂತ್ರಿಸುತ್ತದೆ.",
    askButton: "ಪ್ರಶ್ನೆ ಕೇಳಿ",
    questionRecognized: "ಗುರುತಿಸಿದ ಪ್ರಶ್ನೆ",
    pleaseWait: "ದಯವಿಟ್ಟು ಕಾಯಿರಿ...",
    searching: "ನಿಮ್ಮ ಕುಟುಂಬದ ನೆನಪುಗಳನ್ನು ಹುಡುಕುತ್ತಿದ್ದೇನೆ...",
    youSaid: "ನೀವು ಹೇಳಿದ್ದು",
    yourAnswer: "ನಿಮ್ಮ ಉತ್ತರ ❤️",
    answerReady: "ಉತ್ತರ ಸಿದ್ಧವಾಗಿದೆ. ಧ್ವನಿಯನ್ನು ಕೇಳಿ.",
    answerReadyToListen: "ನಿಮ್ಮ ಉತ್ತರ ಕೇಳಲು ಸಿದ್ಧವಾಗಿದೆ ❤️",
    answerError:
      "ಕ್ಷಮಿಸಿ, ಉತ್ತರ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    selectViewerFirst:
      "ಮೊದಲು ನೆನಪುಗಳನ್ನು ಯಾರು ನೋಡುತ್ತಿದ್ದಾರೆ ಎಂಬುದನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    selectQuestionViewer:
      "AI ಬಳಸುವ ಮೊದಲು ಪ್ರಶ್ನೆ ಕೇಳುವ ವ್ಯಕ್ತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    noProfilePrefix: "ಯಾವುದೇ",
    noProfileSuffix: "ಪ್ರೊಫೈಲ್ ಕಂಡುಬಂದಿಲ್ಲ.",
    loadMemoriesError: "ಕುಟುಂಬದ ನೆನಪುಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    imageFormatError: "JPG, PNG, WEBP ಅಥವಾ GIF ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    transcriptSaved: "ನಿಮ್ಮ ಮಾತಿನ ನೆನಪನ್ನು ಪಠ್ಯವಾಗಿ ಪರಿವರ್ತಿಸಲಾಗಿದೆ ❤️",
    photoUploadError: "ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ.",
    audioUploadError: "ಧ್ವನಿ ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ.",
    memoryTitleRequired: "ನೆನಪಿನ ಶೀರ್ಷಿಕೆಯನ್ನು ನಮೂದಿಸಿ.",
    memoryContentRequired: "ನಿಮ್ಮ ನೆನಪನ್ನು ಮಾತನಾಡಿ ಅಥವಾ ಬರೆಯಿರಿ.",
    loginRequired: "ದಯವಿಟ್ಟು ಮೊದಲು ಲಾಗಿನ್ ಮಾಡಿ.",
    saveMemoryError: "ನೆನಪನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    saveSuccess: "ನೆನಪು, ಫೋಟೋ ಮತ್ತು ಧ್ವನಿಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ! ❤️",
    addMemoryTitle: "💝 ಹೊಸ ಕುಟುಂಬದ ನೆನಪನ್ನು ಸೇರಿಸಿ",
    addMemorySubtitle: "ಹೊಸ ಕುಟುಂಬದ ನೆನಪನ್ನು ಉಳಿಸಿ",
    memoryTitle: "ನೆನಪಿನ ಶೀರ್ಷಿಕೆ",
    memoryTitlePlaceholder: "ಉದಾಹರಣೆ: ನನ್ನ ಬಾಲ್ಯದ ನೆನಪುಗಳು",
    whoseMemory: "ಇದು ಯಾರ ನೆನಪು?",
    generalMemory: "ಸಾಮಾನ್ಯ ಕುಟುಂಬದ ನೆನಪು",
    hideMemory: "🔒 ಈ ನೆನಪನ್ನು ಇವರಿಂದ ಮರೆಮಾಡಿ",
    hideHelp:
      "ಈ ನೆನಪನ್ನು ನೋಡಬಾರದ ಕುಟುಂಬದ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಯಾರನ್ನೂ ಆಯ್ಕೆಮಾಡದಿದ್ದರೆ ಎಲ್ಲರೂ ನೋಡಬಹುದು.",
    noProfiles: "ಯಾವುದೇ ಕುಟುಂಬ ಪ್ರೊಫೈಲ್‌ಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    memoryType: "ನೆನಪಿನ ಪ್ರಕಾರ",
    personal: "ವೈಯಕ್ತಿಕ",
    family: "ಕುಟುಂಬ",
    childhood: "ಬಾಲ್ಯ",
    story: "ಕಥೆ",
    experience: "ಅನುಭವ",
    travel: "ಪ್ರಯಾಣ",
    writeMemory: "ನಿಮ್ಮ ನೆನಪನ್ನು ಬರೆಯಿರಿ",
    writePlaceholder: "ನಿಮ್ಮ ನೆನಪನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...",
    orTellMemory: "ಅಥವಾ ನಿಮ್ಮ ನೆನಪನ್ನು ಹೇಳಿ",
    recordMemory: "ನೆನಪನ್ನು ದಾಖಲಿಸಿ",
    memoryTranscript: "ನೆನಪಿನ ಪಠ್ಯ",
    audioAttached: "🎧 ಮೂಲ ಧ್ವನಿ ದಾಖಲೆ ಸೇರಿಸಲಾಗಿದೆ.",
    attachPhoto: "ಕುಟುಂಬದ ಫೋಟೋ ಸೇರಿಸಿ",
    selected: "📸 ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ:",
    saving: "ನೆನಪನ್ನು ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    saveButton: "❤️ ನನ್ನ ನೆನಪನ್ನು ಉಳಿಸಿ",
    familyMemories: "❤️ ನನ್ನ ಕುಟುಂಬದ ನೆನಪುಗಳು",
    browseDescription: "ನೆನಪುಗಳನ್ನು ನೋಡಲು ಕುಟುಂಬದ ವ್ಯಕ್ತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    profileMemoriesSuffix: " ಅವರ ನೆನಪುಗಳು",
    memoriesSuffix: " ಅವರ ನೆನಪುಗಳು ❤️",
    noSavedMemories: "ಯಾವುದೇ ಉಳಿಸಿದ ನೆನಪುಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
    audioFallback: "ನಿಮ್ಮ ಬ್ರೌಸರ್ ಆಡಿಯೊವನ್ನು ಬೆಂಬಲಿಸುವುದಿಲ್ಲ.",
    familyMemoryCount: "ನಿಮ್ಮ ಕುಟುಂಬದ ನೆನಪುಗಳು",
  },
  Hindi: {
    welcomeTitle: "आपकी यादों की दुनिया में स्वागत है",
    welcomeGreeting: "नमस्कार दादी और दादा",
    welcomeSubtitle: "अपने परिवार की अनमोल यादें संजोएं",
    askSearching: "आपके प्रश्न का उत्तर खोजा जा रहा है...",
    loadErrorStatus: "यादें लोड नहीं हो सकीं। कृपया फिर कोशिश करें।",
    memoriesReadySuffix: " की यादें तैयार हैं ❤️",
    askTitle: "अपनी यादों के बारे में सवाल पूछें",
    viewerLabel: "ये यादें कौन देख रहा है?",
    selectViewer: "देखने वाले व्यक्ति को चुनें",
    viewerHelp:
      "ऐप का उपयोग कर रहे व्यक्ति को चुनें। इससे तय होगा कि कौन-सी यादें सूची और AI उत्तरों से छिपाई जाएंगी।",
    askButton: "प्रश्न पूछें",
    questionRecognized: "पहचाना गया प्रश्न",
    pleaseWait: "कृपया प्रतीक्षा करें...",
    searching: "आपके परिवार की यादें खोजी जा रही हैं...",
    youSaid: "आपने कहा",
    yourAnswer: "आपका उत्तर ❤️",
    answerReady: "उत्तर तैयार है। आवाज़ सुनें।",
    answerReadyToListen: "आपका उत्तर सुनने के लिए तैयार है ❤️",
    answerError: "क्षमा करें, उत्तर नहीं मिल सका। कृपया फिर कोशिश करें।",
    selectViewerFirst: "पहले चुनें कि यादें कौन देख रहा है।",
    selectQuestionViewer:
      "मेमोरी AI का उपयोग करने से पहले प्रश्न पूछने वाले को चुनें।",
    noProfilePrefix: "कोई",
    noProfileSuffix: "प्रोफ़ाइल नहीं मिली।",
    loadMemoriesError: "परिवार की यादें लोड नहीं हो सकीं।",
    imageFormatError: "कृपया JPG, PNG, WEBP या GIF छवि चुनें।",
    transcriptSaved: "आपकी बोली गई याद को टेक्स्ट में बदल दिया गया है ❤️",
    photoUploadError: "फोटो अपलोड नहीं हो सकी।",
    audioUploadError: "आवाज़ अपलोड नहीं हो सकी।",
    memoryTitleRequired: "याद का शीर्षक लिखें।",
    memoryContentRequired: "कृपया अपनी याद बोलें या लिखें।",
    loginRequired: "कृपया पहले लॉगिन करें।",
    saveMemoryError: "याद सेव नहीं हो सकी।",
    saveSuccess: "याद, फोटो और आवाज़ सफलतापूर्वक सेव हो गई! ❤️",
    addMemoryTitle: "💝 नई पारिवारिक याद जोड़ें",
    addMemorySubtitle: "नई पारिवारिक याद सेव करें",
    memoryTitle: "याद का शीर्षक",
    memoryTitlePlaceholder: "उदाहरण: मेरे बचपन की यादें",
    whoseMemory: "यह किसकी याद है?",
    generalMemory: "सामान्य पारिवारिक याद",
    hideMemory: "🔒 यह याद इनसे छिपाएं",
    hideHelp:
      "उन परिवार प्रोफ़ाइलों को चुनें जिन्हें यह याद नहीं दिखनी चाहिए। कुछ भी नहीं चुनने पर सभी इसे देख सकते हैं।",
    noProfiles: "कोई परिवार प्रोफ़ाइल उपलब्ध नहीं है।",
    memoryType: "याद का प्रकार",
    personal: "व्यक्तिगत",
    family: "परिवार",
    childhood: "बचपन",
    story: "कहानी",
    experience: "अनुभव",
    travel: "यात्रा",
    writeMemory: "अपनी याद लिखें",
    writePlaceholder: "अपनी याद यहां लिखें...",
    orTellMemory: "या अपनी याद बोलें",
    recordMemory: "याद रिकॉर्ड करें",
    memoryTranscript: "याद का ट्रांसक्रिप्ट",
    audioAttached: "🎧 मूल वॉइस रिकॉर्डिंग जुड़ी है।",
    attachPhoto: "परिवार की फोटो जोड़ें",
    selected: "📸 चुना गया:",
    saving: "याद सेव हो रही है...",
    saveButton: "❤️ मेरी याद सेव करें",
    familyMemories: "❤️ मेरे परिवार की यादें",
    browseDescription: "यादें देखने के लिए परिवार के सदस्य को चुनें।",
    profileMemoriesSuffix: " की यादें",
    memoriesSuffix: " की यादें ❤️",
    noSavedMemories: "कोई सेव की गई याद नहीं मिली।",
    audioFallback: "आपका ब्राउज़र ऑडियो का समर्थन नहीं करता।",
    familyMemoryCount: "आपके परिवार की यादें",
  },
  Tamil: {
    welcomeTitle: "உங்கள் நினைவு இல்லத்திற்கு வரவேற்கிறோம்",
    welcomeGreeting: "வணக்கம் தாத்தா பாட்டி",
    welcomeSubtitle: "உங்கள் குடும்பத்தின் அரிய நினைவுகளைப் பாதுகாக்கவும்",
    askSearching: "உங்கள் கேள்விக்கான பதிலைத் தேடுகிறேன்...",
    loadErrorStatus: "நினைவுகளை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    memoriesReadySuffix: " அவர்களின் நினைவுகள் தயாராக உள்ளன ❤️",
    askTitle: "உங்கள் நினைவுகளைப் பற்றி கேள்விகள் கேளுங்கள்",
    viewerLabel: "இந்த நினைவுகளை யார் பார்க்கிறார்கள்?",
    selectViewer: "பார்க்கும் நபரைத் தேர்ந்தெடுக்கவும்",
    viewerHelp:
      "தற்போது செயலியைப் பயன்படுத்தும் நபரைத் தேர்ந்தெடுக்கவும். எந்த நினைவுகள் பட்டியலிலும் AI பதில்களிலும் மறைக்கப்பட வேண்டும் என்பதை இது கட்டுப்படுத்தும்.",
    askButton: "கேள்வி கேளுங்கள்",
    questionRecognized: "அறியப்பட்ட கேள்வி",
    pleaseWait: "தயவுசெய்து காத்திருக்கவும்...",
    searching: "உங்கள் குடும்ப நினைவுகளைத் தேடுகிறேன்...",
    youSaid: "நீங்கள் கூறியது",
    yourAnswer: "உங்கள் பதில் ❤️",
    answerReady: "பதில் தயாராக உள்ளது. குரலைக் கேளுங்கள்.",
    answerReadyToListen: "உங்கள் பதிலைக் கேட்கத் தயாராக உள்ளது ❤️",
    answerError:
      "மன்னிக்கவும், பதிலைப் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    selectViewerFirst:
      "முதலில் நினைவுகளைப் பார்ப்பவர் யார் என்பதைத் தேர்ந்தெடுக்கவும்.",
    selectQuestionViewer:
      "நினைவு AI-ஐப் பயன்படுத்துவதற்கு முன் கேள்வி கேட்பவரைத் தேர்ந்தெடுக்கவும்.",
    noProfilePrefix: "எந்த",
    noProfileSuffix: "சுயவிவரமும் கிடைக்கவில்லை.",
    loadMemoriesError: "குடும்ப நினைவுகளை ஏற்ற முடியவில்லை.",
    imageFormatError: "JPG, PNG, WEBP அல்லது GIF படத்தைத் தேர்ந்தெடுக்கவும்.",
    transcriptSaved: "நீங்கள் பேசிய நினைவு உரையாக மாற்றப்பட்டது ❤️",
    photoUploadError: "புகைப்படத்தைப் பதிவேற்ற முடியவில்லை.",
    audioUploadError: "குரலைப் பதிவேற்ற முடியவில்லை.",
    memoryTitleRequired: "நினைவின் தலைப்பை உள்ளிடவும்.",
    memoryContentRequired: "உங்கள் நினைவைப் பேசவும் அல்லது எழுதவும்.",
    loginRequired: "முதலில் உள்நுழையவும்.",
    saveMemoryError: "நினைவைச் சேமிக்க முடியவில்லை.",
    saveSuccess:
      "நினைவு, புகைப்படம் மற்றும் குரல் வெற்றிகரமாகச் சேமிக்கப்பட்டன! ❤️",
    addMemoryTitle: "💝 புதிய குடும்ப நினைவைச் சேர்க்கவும்",
    addMemorySubtitle: "புதிய குடும்ப நினைவைச் சேமிக்கவும்",
    memoryTitle: "நினைவின் தலைப்பு",
    memoryTitlePlaceholder: "உதாரணம்: என் குழந்தைப் பருவ நினைவுகள்",
    whoseMemory: "இது யாருடைய நினைவு?",
    generalMemory: "பொதுவான குடும்ப நினைவு",
    hideMemory: "🔒 இந்த நினைவை இவர்களிடமிருந்து மறைக்கவும்",
    hideHelp:
      "இந்த நினைவைக் காணக்கூடாத குடும்பச் சுயவிவரங்களைத் தேர்ந்தெடுக்கவும். எதையும் தேர்ந்தெடுக்காவிட்டால் அனைவரும் பார்க்கலாம்.",
    noProfiles: "குடும்பச் சுயவிவரங்கள் எதுவும் இல்லை.",
    memoryType: "நினைவு வகை",
    personal: "தனிப்பட்ட",
    family: "குடும்பம்",
    childhood: "குழந்தைப் பருவம்",
    story: "கதை",
    experience: "அனுபவம்",
    travel: "பயணம்",
    writeMemory: "உங்கள் நினைவை எழுதுங்கள்",
    writePlaceholder: "உங்கள் நினைவை இங்கே எழுதுங்கள்...",
    orTellMemory: "அல்லது உங்கள் நினைவைக் கூறுங்கள்",
    recordMemory: "நினைவைப் பதிவு செய்யவும்",
    memoryTranscript: "நினைவின் உரை",
    audioAttached: "🎧 அசல் குரல் பதிவு இணைக்கப்பட்டுள்ளது.",
    attachPhoto: "குடும்பப் புகைப்படத்தைச் சேர்க்கவும்",
    selected: "📸 தேர்ந்தெடுக்கப்பட்டது:",
    saving: "நினைவு சேமிக்கப்படுகிறது...",
    saveButton: "❤️ என் நினைவைச் சேமிக்கவும்",
    familyMemories: "❤️ என் குடும்ப நினைவுகள்",
    browseDescription:
      "நினைவுகளைப் பார்க்க குடும்ப உறுப்பினரைத் தேர்ந்தெடுக்கவும்.",
    profileMemoriesSuffix: " அவர்களின் நினைவுகள்",
    memoriesSuffix: " அவர்களின் நினைவுகள் ❤️",
    noSavedMemories: "சேமித்த நினைவுகள் எதுவும் கிடைக்கவில்லை.",
    audioFallback: "உங்கள் உலாவி ஒலியை ஆதரிக்கவில்லை.",
    familyMemoryCount: "உங்கள் குடும்ப நினைவுகள்",
  },
  Malayalam: {
    welcomeTitle: "നിങ്ങളുടെ ഓർമ്മവീട്ടിലേക്ക് സ്വാഗതം",
    welcomeGreeting: "നമസ്കാരം മുത്തശ്ശനും മുത്തശ്ശിക്കും",
    welcomeSubtitle: "നിങ്ങളുടെ കുടുംബത്തിന്റെ വിലപ്പെട്ട ഓർമ്മകൾ സൂക്ഷിക്കൂ",
    askSearching: "നിങ്ങളുടെ ചോദ്യത്തിനുള്ള ഉത്തരം തിരയുന്നു...",
    loadErrorStatus: "ഓർമ്മകൾ ലോഡ് ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക.",
    memoriesReadySuffix: "-ന്റെ ഓർമ്മകൾ തയ്യാറാണ് ❤️",
    askTitle: "നിങ്ങളുടെ ഓർമ്മകളെക്കുറിച്ച് ചോദ്യങ്ങൾ ചോദിക്കൂ",
    viewerLabel: "ഈ ഓർമ്മകൾ ആരാണ് കാണുന്നത്?",
    selectViewer: "കാണുന്ന വ്യക്തിയെ തിരഞ്ഞെടുക്കുക",
    viewerHelp:
      "ഇപ്പോൾ ആപ്പ് ഉപയോഗിക്കുന്ന വ്യക്തിയെ തിരഞ്ഞെടുക്കുക. ലിസ്റ്റിൽ നിന്നും AI ഉത്തരങ്ങളിൽ നിന്നും മറയ്ക്കേണ്ട ഓർമ്മകൾ ഇത് നിയന്ത്രിക്കുന്നു.",
    askButton: "ഒരു ചോദ്യം ചോദിക്കുക",
    questionRecognized: "തിരിച്ചറിഞ്ഞ ചോദ്യം",
    pleaseWait: "ദയവായി കാത്തിരിക്കുക...",
    searching: "നിങ്ങളുടെ കുടുംബ ഓർമ്മകൾ തിരയുന്നു...",
    youSaid: "നിങ്ങൾ പറഞ്ഞത്",
    yourAnswer: "നിങ്ങളുടെ ഉത്തരം ❤️",
    answerReady: "ഉത്തരം തയ്യാറായി. ശബ്ദം കേൾക്കൂ.",
    answerReadyToListen: "നിങ്ങളുടെ ഉത്തരം കേൾക്കാൻ തയ്യാറാണ് ❤️",
    answerError: "ക്ഷമിക്കണം, ഉത്തരം ലഭിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക.",
    selectViewerFirst: "ആദ്യം ഓർമ്മകൾ കാണുന്ന വ്യക്തിയെ തിരഞ്ഞെടുക്കുക.",
    selectQuestionViewer:
      "മെമ്മറി AI ഉപയോഗിക്കുന്നതിന് മുമ്പ് ചോദ്യം ചോദിക്കുന്ന വ്യക്തിയെ തിരഞ്ഞെടുക്കുക.",
    noProfilePrefix: "ഒരു",
    noProfileSuffix: "പ്രൊഫൈൽ കണ്ടെത്തിയില്ല.",
    loadMemoriesError: "കുടുംബ ഓർമ്മകൾ ലോഡ് ചെയ്യാനായില്ല.",
    imageFormatError: "JPG, PNG, WEBP അല്ലെങ്കിൽ GIF ചിത്രം തിരഞ്ഞെടുക്കുക.",
    transcriptSaved: "നിങ്ങൾ പറഞ്ഞ ഓർമ്മ എഴുത്താക്കി മാറ്റി ❤️",
    photoUploadError: "ഫോട്ടോ അപ്‌ലോഡ് പരാജയപ്പെട്ടു.",
    audioUploadError: "ശബ്ദം അപ്‌ലോഡ് പരാജയപ്പെട്ടു.",
    memoryTitleRequired: "ഓർമ്മയുടെ തലക്കെട്ട് നൽകുക.",
    memoryContentRequired: "നിങ്ങളുടെ ഓർമ്മ പറയുകയോ എഴുതുകയോ ചെയ്യുക.",
    loginRequired: "ആദ്യം ലോഗിൻ ചെയ്യുക.",
    saveMemoryError: "ഓർമ്മ സംരക്ഷിക്കാനായില്ല.",
    saveSuccess: "ഓർമ്മയും ഫോട്ടോയും ശബ്ദവും വിജയകരമായി സംരക്ഷിച്ചു! ❤️",
    addMemoryTitle: "💝 പുതിയ കുടുംബ ഓർമ്മ ചേർക്കുക",
    addMemorySubtitle: "പുതിയ കുടുംബ ഓർമ്മ സംരക്ഷിക്കുക",
    memoryTitle: "ഓർമ്മയുടെ തലക്കെട്ട്",
    memoryTitlePlaceholder: "ഉദാഹരണം: എന്റെ ബാല്യകാല ഓർമ്മകൾ",
    whoseMemory: "ഇത് ആരുടെ ഓർമ്മയാണ്?",
    generalMemory: "പൊതുവായ കുടുംബ ഓർമ്മ",
    hideMemory: "🔒 ഈ ഓർമ്മ ഇവരിൽ നിന്ന് മറയ്ക്കുക",
    hideHelp:
      "ഈ ഓർമ്മ കാണരുതാത്ത കുടുംബ പ്രൊഫൈലുകൾ തിരഞ്ഞെടുക്കുക. ഒന്നും തിരഞ്ഞെടുക്കാത്താൽ എല്ലാവർക്കും കാണാം.",
    noProfiles: "കുടുംബ പ്രൊഫൈലുകളൊന്നും ലഭ്യമല്ല.",
    memoryType: "ഓർമ്മയുടെ തരം",
    personal: "വ്യക്തിഗതം",
    family: "കുടുംബം",
    childhood: "ബാല്യം",
    story: "കഥ",
    experience: "അനുഭവം",
    travel: "യാത്ര",
    writeMemory: "നിങ്ങളുടെ ഓർമ്മ എഴുതുക",
    writePlaceholder: "നിങ്ങളുടെ ഓർമ്മ ഇവിടെ എഴുതുക...",
    orTellMemory: "അല്ലെങ്കിൽ നിങ്ങളുടെ ഓർമ്മ പറയുക",
    recordMemory: "ഒരു ഓർമ്മ റെക്കോർഡ് ചെയ്യുക",
    memoryTranscript: "ഓർമ്മയുടെ ട്രാൻസ്ക്രിപ്റ്റ്",
    audioAttached: "🎧 യഥാർത്ഥ ശബ്ദ റെക്കോർഡിംഗ് ചേർത്തു.",
    attachPhoto: "കുടുംബ ഫോട്ടോ ചേർക്കുക",
    selected: "📸 തിരഞ്ഞെടുത്തത്:",
    saving: "ഓർമ്മ സംരക്ഷിക്കുന്നു...",
    saveButton: "❤️ എന്റെ ഓർമ്മ സംരക്ഷിക്കുക",
    familyMemories: "❤️ എന്റെ കുടുംബ ഓർമ്മകൾ",
    browseDescription: "ഓർമ്മകൾ കാണാൻ ഒരു കുടുംബാംഗത്തെ തിരഞ്ഞെടുക്കുക.",
    profileMemoriesSuffix: "-ന്റെ ഓർമ്മകൾ",
    memoriesSuffix: "-ന്റെ ഓർമ്മകൾ ❤️",
    noSavedMemories: "സംരക്ഷിച്ച ഓർമ്മകളൊന്നും കണ്ടെത്തിയില്ല.",
    audioFallback: "നിങ്ങളുടെ ബ്രൗസർ ഓഡിയോ പിന്തുണയ്ക്കുന്നില്ല.",
    familyMemoryCount: "നിങ്ങളുടെ കുടുംബ ഓർമ്മകൾ",
  },
};

function GrandparentsMode({
  apiBaseUrl,
  userId,
  memories = [],
  profiles = [],
  language = "English",
}) {
  const gt =
    grandparentsTranslations[language] || grandparentsTranslations.English;
  const languageCode =
    { English: "en", Kannada: "kn", Hindi: "hi", Tamil: "ta", Malayalam: "ml" }[
      language
    ] || "en";

  // Question and AI states
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Browse memories states
  const [shownMemories, setShownMemories] = useState([]);
  const [showingMemories, setShowingMemories] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("");
  const familyMemoriesRef = useRef(null);

  useEffect(() => {
    if (showingMemories && familyMemoriesRef.current) {
      familyMemoriesRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showingMemories, selectedProfile]);

  // Add memory states
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryType, setMemoryType] = useState("personal");
  const [memoryProfileId, setMemoryProfileId] = useState("");
  const [hiddenFromProfileIds, setHiddenFromProfileIds] = useState([]);
  // The signed-in family PIN session identifies the viewer automatically.
  // Owner sessions have full owner access and do not need a viewer selector.
  const viewerProfileId =
    localStorage.getItem("account_type") === "family"
      ? localStorage.getItem("family_profile_id") || ""
      : "";
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [savingMemory, setSavingMemory] = useState(false);
  const [memoryMessage, setMemoryMessage] = useState("");

  // Clean up AI audio
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Match relationships and profile names in English and the supported
  // Indian languages. This drives automatic navigation to the right profile.
  const relationshipAliases = {
    father: [
      "father",
      "dad",
      "daddy",
      "papa",
      "appa",
      "ಅಪ್ಪ",
      "ತಂದೆ",
      "पिता",
      "पिताजी",
      "पापा",
      "அப்பா",
      "தந்தை",
      "അച്ഛൻ",
      "അപ്പൻ",
    ],
    mother: [
      "mother",
      "mom",
      "mommy",
      "mama",
      "amma",
      "ಅಮ್ಮ",
      "ತಾಯಿ",
      "माँ",
      "माता",
      "मम्मी",
      "அம்மா",
      "தாய்",
      "അമ്മ",
      "മാതാവ്",
    ],
    grandfather: [
      "grandfather",
      "grandpa",
      "granddad",
      "ajja",
      "ಅಜ್ಜ",
      "ತಾತ",
      "दादा",
      "नाना",
      "தாத்தா",
      "அய்யா",
      "മുത്തച്ഛൻ",
      "അപ്പൂപ്പൻ",
    ],
    grandmother: [
      "grandmother",
      "grandma",
      "granny",
      "ajji",
      "ಅಜ್ಜಿ",
      "ಅಜ್ಜೀ",
      "दादी",
      "नानी",
      "பாட்டி",
      "அம்மம்மா",
      "അമ്മൂമ്മ",
      "മുത്തശ്ശി",
    ],
  };

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLocaleLowerCase();

  const questionContains = (question, phrase) => {
    const q = normalizeText(question);
    const p = normalizeText(phrase);
    if (!p) return false;

    // Use word boundaries for Latin words so "dad" does not match
    // unrelated words; use substring matching for native scripts.
    if (/^[a-z0-9][a-z0-9\s'-]*$/i.test(p)) {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(q);
    }
    return q.includes(p);
  };

  const findFamilyProfile = (relationship) => {
    const aliases = relationshipAliases[relationship] || [relationship];
    return profiles.find((profile) => {
      const type = normalizeText(profile.relationship_type);
      const name = normalizeText(profile.name);
      return (
        aliases.includes(type) ||
        aliases.some((alias) => type === alias || type.includes(alias)) ||
        aliases.includes(name)
      );
    });
  };

  const findProfileMentionedInQuestion = (question) => {
    // Prefer an exact saved profile name, especially when two profiles have
    // similar relationship labels.
    const namedProfile = [...profiles]
      .filter((profile) => profile.name?.trim())
      .sort((a, b) => b.name.trim().length - a.name.trim().length)
      .find((profile) => questionContains(question, profile.name.trim()));

    if (namedProfile) return namedProfile;

    for (const relationship of Object.keys(relationshipAliases)) {
      const aliases = relationshipAliases[relationship];
      if (aliases.some((alias) => questionContains(question, alias))) {
        const profile = findFamilyProfile(relationship);
        if (profile) return profile;
      }
    }

    return null;
  };

  // Fetch all memories for a profile
  const loadProfileMemories = async (profileId, profileName) => {
    const query = new URLSearchParams({
      user_id: String(userId),
    });

    if (profileId) {
      query.set("profile_id", String(profileId));
    }

    if (viewerProfileId) {
      query.set("viewer_profile_id", String(viewerProfileId));
    }

    const response = await apiFetch(
      `${apiBaseUrl}/memories/?${query.toString()}`,
    );

    if (!response.ok) {
      throw new Error(gt.loadMemoriesError);
    }

    const data = await response.json();

    setShownMemories(data);
    setShowingMemories(true);
    setSelectedProfile(profileName);

    return data;
  };

  // Browse a family member's memories
  const handleProfileClick = async (profile) => {
    setLoading(true);
    setStatus(gt.searching);

    try {
      await loadProfileMemories(profile.id, profile.name);
      setStatus(`${profile.name}${gt.memoriesReadySuffix}`);
    } catch (error) {
      console.error("Family memory error:", error);
      setStatus(gt.loadErrorStatus);
    } finally {
      setLoading(false);
    }
  };

  // Display Dad or Mom memories
  const showFamilyMemories = async (relationship) => {
    const profile = findFamilyProfile(relationship);

    if (!profile) {
      setStatus(`${gt.noProfilePrefix} ${relationship} ${gt.noProfileSuffix}`);
      return;
    }

    await loadProfileMemories(profile.id, profile.name);
    setStatus(`${profile.name}${gt.memoriesReadySuffix}`);
  };

  // Ask a question using AI. If a person is named, open that person's
  // memory page automatically and ask the AI using that profile's memories.
  const handleQuestion = async (spokenText) => {
    if (!spokenText?.trim()) return;

    setTranscript(spokenText);
    setAnswer("");
    setAudioUrl("");
    setLoading(true);
    setStatus(gt.askSearching);

    try {
      const mentionedProfile = findProfileMentionedInQuestion(spokenText);

      if (mentionedProfile) {
        await loadProfileMemories(mentionedProfile.id, mentionedProfile.name);
      } else {
        setShowingMemories(false);
        setShownMemories([]);
        setSelectedProfile("");
      }

      const chatResponse = await apiFetch(`${apiBaseUrl}/memories/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          profile_id: mentionedProfile ? Number(mentionedProfile.id) : null,
          // Family sessions are bound to their PIN-authenticated profile by
          // apiFetch/backend. Owner sessions intentionally send no viewer ID.
          viewer_profile_id: viewerProfileId ? Number(viewerProfileId) : null,
          question: spokenText,
          language,
        }),
      });

      const chatResult = await chatResponse.json();

      if (!chatResponse.ok) {
        throw new Error(chatResult.detail || gt.answerError);
      }

      const aiAnswer = chatResult.answer?.trim();
      if (!aiAnswer) {
        throw new Error(gt.answerError);
      }

      setAnswer(aiAnswer);
      setStatus(
        mentionedProfile
          ? `${mentionedProfile.name}${gt.memoriesReadySuffix}`
          : gt.answerReady,
      );

      // Generate voice in the selected language.
      const voiceResponse = await fetch(`${TTS_API}/tts/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          text: aiAnswer,
          language,
        }),
      });

      if (!voiceResponse.ok) {
        throw new Error(gt.answerError);
      }

      const audioBlob = await voiceResponse.blob();
      setAudioUrl(URL.createObjectURL(audioBlob));
      setStatus(gt.answerReadyToListen);
    } catch (error) {
      console.error("Grandparents AI error:", error);
      setStatus(error.message || gt.answerError);
    } finally {
      setLoading(false);
    }
  };

  // Select photo
  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setMemoryMessage(gt.imageFormatError);
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setMemoryMessage("");
  };

  // Receive a spoken memory transcript
  const handleMemoryTranscript = (text) => {
    setMemoryContent(text);
    setMemoryMessage(gt.transcriptSaved);
  };

  // Select which family profiles must not see this memory
  const handleHiddenProfileChange = (profileId, checked) => {
    const numericProfileId = Number(profileId);

    setHiddenFromProfileIds((current) => {
      if (checked) {
        return current.includes(numericProfileId)
          ? current
          : [...current, numericProfileId];
      }

      return current.filter((id) => id !== numericProfileId);
    });
  };

  // Save memory photo
  const uploadMemoryImage = async (memoryId) => {
    const formData = new FormData();
    formData.append("image", selectedImage);

    const response = await apiFetch(
      `${apiBaseUrl}/memories/${memoryId}/image`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || gt.photoUploadError);
    }
  };

  // Save original voice recording
  const uploadMemoryAudio = async (memoryId) => {
    const formData = new FormData();

    formData.append("audio", selectedAudio, "memory.webm");

    const response = await apiFetch(
      `${apiBaseUrl}/memories/${memoryId}/audio`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || gt.audioUploadError);
    }
  };

  // Save new memory
  const handleSaveMemory = async (event) => {
    event.preventDefault();

    setMemoryMessage("");

    if (!memoryTitle.trim()) {
      setMemoryMessage(gt.memoryTitleRequired);
      return;
    }

    if (!memoryContent.trim()) {
      setMemoryMessage(gt.memoryContentRequired);
      return;
    }

    if (!userId) {
      setMemoryMessage(gt.loginRequired);
      return;
    }

    setSavingMemory(true);

    try {
      // Create memory in database
      const response = await apiFetch(`${apiBaseUrl}/memories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: memoryTitle.trim(),
          content: memoryContent.trim(),
          memory_type: memoryType,
          user_id: Number(userId),
          profile_id: memoryProfileId ? Number(memoryProfileId) : null,
          hidden_from_profile_ids: hiddenFromProfileIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || gt.saveMemoryError);
      }

      const memoryId = data.id;

      // Upload optional photo
      if (selectedImage) {
        await uploadMemoryImage(memoryId);
      }

      // Upload optional original voice
      if (selectedAudio) {
        await uploadMemoryAudio(memoryId);
      }

      // Refresh displayed memories
      const profile = profiles.find(
        (item) => String(item.id) === String(memoryProfileId),
      );

      await loadProfileMemories(
        memoryProfileId || null,
        profile?.name || "Family Memories",
      );

      // Clear form
      setMemoryTitle("");
      setMemoryContent("");
      setMemoryType("personal");
      setMemoryProfileId("");
      setHiddenFromProfileIds([]);
      setSelectedImage(null);
      setSelectedAudio(null);

      setMemoryMessage(gt.saveSuccess);
    } catch (error) {
      console.error("Save memory error:", error);

      setMemoryMessage(error.message || gt.saveMemoryError);
    } finally {
      setSavingMemory(false);
    }
  };

  return (
    <div className="grandparents-mode">
      {/* Welcome */}
      <header className="grandparents-header">
        <div className="grandparents-heart">❤️</div>
        <h1>{gt.welcomeGreeting}</h1>
        <p>{gt.welcomeSubtitle}</p>
        <span>{gt.welcomeTitle}</span>
      </header>

      {/* Ask questions */}
      <section className="grandparents-talk">
        <div className="grandparents-mic">🎤</div>

        <h2>{gt.askTitle}</h2>

        <VoiceRecorder
          transcriptionLanguage={languageCode}
          onTextGenerated={handleQuestion}
          buttonLabel={gt.askButton}
          transcriptLabel={gt.questionRecognized}
        />
      </section>

      {status && <p className="voice-status">{status}</p>}

      {loading && (
        <section className="grandparents-result">
          <h2>{gt.pleaseWait}</h2>
          <p>{gt.searching}</p>
        </section>
      )}

      {transcript && (
        <section className="grandparents-result">
          <h2>{gt.youSaid}</h2>
          <p>{transcript}</p>
        </section>
      )}

      {answer && (
        <section className="grandparents-result">
          <h2>{gt.yourAnswer}</h2>
          <p>{answer}</p>

          {audioUrl && (
            <audio controls src={audioUrl} style={{ width: "100%" }} />
          )}
        </section>
      )}

      {/* Add a new memory */}
      <section className="grandparents-memory-add">
        <h2>{gt.addMemoryTitle}</h2>
        <p>{gt.addMemorySubtitle}</p>

        <form onSubmit={handleSaveMemory}>
          <label>{gt.memoryTitle}</label>

          <input
            type="text"
            value={memoryTitle}
            onChange={(event) => setMemoryTitle(event.target.value)}
            placeholder={gt.memoryTitlePlaceholder}
            required
          />

          <label>{gt.whoseMemory}</label>

          <select
            value={memoryProfileId}
            onChange={(event) => setMemoryProfileId(event.target.value)}
          >
            <option value="">{gt.generalMemory}</option>

            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.relationship_type})
              </option>
            ))}
          </select>

          <fieldset className="memory-privacy-options">
            <legend>{gt.hideMemory}</legend>
            <p className="memory-privacy-help">{gt.hideHelp}</p>

            {profiles.length === 0 ? (
              <p>{gt.noProfiles}</p>
            ) : (
              <div className="memory-privacy-list">
                {profiles.map((profile) => (
                  <label className="memory-privacy-option" key={profile.id}>
                    <input
                      type="checkbox"
                      checked={hiddenFromProfileIds.includes(
                        Number(profile.id),
                      )}
                      onChange={(event) =>
                        handleHiddenProfileChange(
                          profile.id,
                          event.target.checked,
                        )
                      }
                    />
                    <span>
                      {profile.name} ({profile.relationship_type})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <label>{gt.memoryType}</label>

          <select
            value={memoryType}
            onChange={(event) => setMemoryType(event.target.value)}
          >
            <option value="personal">{gt.personal}</option>
            <option value="family">{gt.family}</option>
            <option value="childhood">{gt.childhood}</option>
            <option value="story">{gt.story}</option>
            <option value="experience">{gt.experience}</option>
            <option value="travel">{gt.travel}</option>
          </select>

          <label>{gt.writeMemory}</label>

          <textarea
            value={memoryContent}
            onChange={(event) => setMemoryContent(event.target.value)}
            placeholder={gt.writePlaceholder}
            rows={5}
            required
          />

          <p>{gt.orTellMemory} 🎤</p>

          <VoiceRecorder
            transcriptionLanguage={languageCode}
            onTextGenerated={handleMemoryTranscript}
            onAudioRecorded={setSelectedAudio}
            buttonLabel={gt.recordMemory}
            transcriptLabel={gt.memoryTranscript}
          />

          {selectedAudio && <p>{gt.audioAttached}</p>}

          <label>{gt.attachPhoto}</label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
          />

          {selectedImage && (
            <p>
              {gt.selected} {selectedImage.name}
            </p>
          )}

          <button type="submit" disabled={savingMemory}>
            {savingMemory ? gt.saving : gt.saveButton}
          </button>

          {memoryMessage && <p className="voice-status">{memoryMessage}</p>}
        </form>
      </section>

      {/* Browse family members */}
      <section className="family-memory-browser">
        <h2>{gt.familyMemories}</h2>
        <p>{gt.browseDescription}</p>

        <div className="grandparents-actions">
          {profiles.map((profile) => (
            <button
              type="button"
              className="grandparents-card"
              key={profile.id}
              onClick={() => handleProfileClick(profile)}
              disabled={loading}
            >
              <span>👨‍👩‍👧‍👦</span>
              <h3>{profile.name}</h3>
              <p>
                {profile.name}
                {gt.profileMemoriesSuffix}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Display saved memories */}
      {showingMemories && (
        <section className="family-memories" ref={familyMemoriesRef}>
          <h2>
            {selectedProfile}
            {gt.memoriesSuffix}
          </h2>

          {shownMemories.length === 0 ? (
            <p>{gt.noSavedMemories}</p>
          ) : (
            shownMemories.map((memory) => (
              <article className="family-memory-card" key={memory.id}>
                <h3>{memory.title}</h3>
                <p>{memory.content}</p>

                {memory.image_url && (
                  <AuthenticatedImage
                    src={`${apiBaseUrl}${memory.image_url}`}
                    alt={memory.title}
                    className="family-memory-image"
                  />
                )}

                {memory.audio_url && (
                  <AuthenticatedAudio
                    controls
                    style={{ width: "100%" }}
                    src={`${apiBaseUrl}${memory.audio_url}`}
                  >
                    {gt.audioFallback}
                  </AuthenticatedAudio>
                )}
              </article>
            ))
          )}
        </section>
      )}

      <p className="grandparents-memory-count">
        {gt.familyMemoryCount}: {memories.length}
      </p>
    </div>
  );
}

export default GrandparentsMode;
