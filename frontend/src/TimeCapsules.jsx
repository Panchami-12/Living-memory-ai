import { apiFetch } from "./apiFetch";
import { AuthenticatedImage, AuthenticatedAudio } from "./AuthenticatedMedia";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./TimeCapsules.css";

const copy = {
  English: {
    eyebrow: "A MESSAGE FOR THE FUTURE",
    heading: "Digital Time Capsule",
    intro:
      "Save a letter, a few memories and a voice or photo attachment. Choose when your capsule can be opened.",
    create: "Create a time capsule",
    title: "Capsule title",
    titleHint: "Example: Open on my 25th birthday",
    recipient: "For whom? (optional)",
    recipientHint: "My future self, Mother, My family...",
    profile: "Link a person profile (optional)",
    noProfile: "No profile",
    unlock: "Unlock date and time",
    message: "Your letter or message",
    messageHint:
      "Write something you want to remember or share in the future...",
    attach: "Attach saved memories (optional)",
    attachHint:
      "Choose existing memories. Their details stay hidden until the capsule unlocks.",
    save: "Seal time capsule",
    saving: "Sealing...",
    refresh: "Refresh",
    yourCapsules: "Your time capsules",
    empty: "No time capsules yet",
    emptyHint: "Create your first capsule and leave a message for the future.",
    sealed: "SEALED",
    unlocked: "READY TO OPEN",
    open: "Open capsule",
    delete: "Delete capsule",
    cancel: "Cancel",
    lockedHint: "This capsule is sealed until its unlock date.",
    opensOn: "Opens on",
    createdOn: "Created",
    detail: "Capsule contents",
    attached: "Memories inside",
    noAttachments: "No memories were attached.",
    close: "Close",
    confirmDelete: "Delete this time capsule permanently?",
    created: "Your time capsule has been sealed.",
    deleted: "Time capsule deleted.",
    loadError: "Could not load time capsules.",
    saveError: "Could not create the time capsule.",
    openError: "This capsule is still sealed or could not be opened.",
    invalidDate: "Choose a future date and time.",
    note: "Only the title, recipient and unlock date are shown before the capsule opens. The message and attached memory details remain hidden by the server.",
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
    chooseProfile: "Choose a profile",
    attachmentCount: "memories attached",
    makePromise: "MAKE A PROMISE TO YOUR FUTURE SELF",
    noSavedMemories: "No saved memories available yet.",
    waitingMoment: "WAITING FOR THE RIGHT MOMENT",
    loading: "Loading...",
    opening: "Opening...",
    forLabel: "For",
    messageFromPast: "A MESSAGE FROM THE PAST",
    memoryTypeLabels: {
      personal: "Personal",
      college: "College",
      family: "Family",
      friends: "Friends",
      achievement: "Achievement",
      project: "Project",
      food: "Food",
      travel: "Travel",
      other: "Other",
    },
  },
  Kannada: {
    eyebrow: "ಭವಿಷ್ಯಕ್ಕಾಗಿ ಒಂದು ಸಂದೇಶ",
    heading: "ಡಿಜಿಟಲ್ ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್",
    intro:
      "ಪತ್ರ, ನೆನಪುಗಳು ಮತ್ತು ಧ್ವನಿ ಅಥವಾ ಫೋಟೋಗಳನ್ನು ಉಳಿಸಿ. ಕ್ಯಾಪ್ಸೂಲ್ ಯಾವಾಗ ತೆರೆಯಬೇಕು ಎಂಬುದನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    create: "ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್ ರಚಿಸಿ",
    title: "ಕ್ಯಾಪ್ಸೂಲ್ ಶೀರ್ಷಿಕೆ",
    titleHint: "ಉದಾ: ನನ್ನ 25ನೇ ಹುಟ್ಟುಹಬ್ಬದಂದು ತೆರೆಯಿರಿ",
    recipient: "ಯಾರಿಗಾಗಿ? (ಐಚ್ಛಿಕ)",
    recipientHint: "ನನ್ನ ಭವಿಷ್ಯದ ನನಗೆ, ಅಮ್ಮ, ನನ್ನ ಕುಟುಂಬ...",
    profile: "ವ್ಯಕ್ತಿ ಪ್ರೊಫೈಲ್ ಲಿಂಕ್ ಮಾಡಿ (ಐಚ್ಛಿಕ)",
    noProfile: "ಪ್ರೊಫೈಲ್ ಇಲ್ಲ",
    unlock: "ತೆರೆಯುವ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ",
    message: "ನಿಮ್ಮ ಪತ್ರ ಅಥವಾ ಸಂದೇಶ",
    messageHint:
      "ಭವಿಷ್ಯದಲ್ಲಿ ನೆನಪಿಸಿಕೊಳ್ಳಲು ಅಥವಾ ಹಂಚಿಕೊಳ್ಳಲು ಬಯಸುವ ವಿಷಯವನ್ನು ಬರೆಯಿರಿ...",
    attach: "ಉಳಿಸಿದ ನೆನಪುಗಳನ್ನು ಸೇರಿಸಿ (ಐಚ್ಛಿಕ)",
    attachHint:
      "ಈಗಿರುವ ನೆನಪುಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಕ್ಯಾಪ್ಸೂಲ್ ತೆರೆಯುವವರೆಗೆ ಅವುಗಳ ವಿವರಗಳು ಮರೆಮಾಡಲ್ಪಡುತ್ತವೆ.",
    save: "ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್ ಸೀಲ್ ಮಾಡಿ",
    saving: "ಸೀಲ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    refresh: "ರಿಫ್ರೆಶ್",
    yourCapsules: "ನಿಮ್ಮ ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್‌ಗಳು",
    empty: "ಇನ್ನೂ ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್ ಇಲ್ಲ",
    emptyHint: "ನಿಮ್ಮ ಮೊದಲ ಕ್ಯಾಪ್ಸೂಲ್ ರಚಿಸಿ, ಭವಿಷ್ಯಕ್ಕಾಗಿ ಸಂದೇಶ ಬಿಡಿ.",
    sealed: "ಸೀಲ್ ಮಾಡಲಾಗಿದೆ",
    unlocked: "ತೆರೆಯಲು ಸಿದ್ಧ",
    open: "ಕ್ಯಾಪ್ಸೂಲ್ ತೆರೆಯಿರಿ",
    delete: "ಕ್ಯಾಪ್ಸೂಲ್ ಅಳಿಸಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    lockedHint: "ತೆರೆಯುವ ದಿನಾಂಕದವರೆಗೆ ಈ ಕ್ಯಾಪ್ಸೂಲ್ ಸೀಲ್ ಆಗಿರುತ್ತದೆ.",
    opensOn: "ತೆರೆಯುವ ದಿನ",
    createdOn: "ರಚಿಸಿದ ದಿನ",
    detail: "ಕ್ಯಾಪ್ಸೂಲ್ ವಿಷಯಗಳು",
    attached: "ಒಳಗಿನ ನೆನಪುಗಳು",
    noAttachments: "ಯಾವುದೇ ನೆನಪುಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.",
    close: "ಮುಚ್ಚಿ",
    confirmDelete: "ಈ ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್ ಅನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಬೇಕೇ?",
    created: "ನಿಮ್ಮ ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್ ಸೀಲ್ ಮಾಡಲಾಗಿದೆ.",
    deleted: "ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್ ಅಳಿಸಲಾಗಿದೆ.",
    loadError: "ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    saveError: "ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್ ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    openError: "ಈ ಕ್ಯಾಪ್ಸೂಲ್ ಇನ್ನೂ ಸೀಲ್ ಆಗಿದೆ ಅಥವಾ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.",
    invalidDate: "ಭವಿಷ್ಯದ ದಿನಾಂಕ ಮತ್ತು ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    note: "ತೆರೆಯುವ ಮೊದಲು ಶೀರ್ಷಿಕೆ, ಸ್ವೀಕರಿಸುವವರು ಮತ್ತು ತೆರೆಯುವ ದಿನಾಂಕ ಮಾತ್ರ ಕಾಣಿಸುತ್ತವೆ. ಸಂದೇಶ ಮತ್ತು ನೆನಪುಗಳ ವಿವರಗಳನ್ನು ಸರ್ವರ್ ಮರೆಮಾಡುತ್ತದೆ.",
    days: "ದಿನಗಳು",
    hours: "ಗಂಟೆಗಳು",
    minutes: "ನಿಮಿಷಗಳು",
    seconds: "ಸೆಕೆಂಡುಗಳು",
    chooseProfile: "ಪ್ರೊಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ",
    attachmentCount: "ನೆನಪುಗಳನ್ನು ಸೇರಿಸಲಾಗಿದೆ",
    makePromise: "ನಿಮ್ಮ ಭವಿಷ್ಯದ ನಿಮಗೆ ಒಂದು ಭರವಸೆ ನೀಡಿ",
    noSavedMemories: "ಇನ್ನೂ ಉಳಿಸಿದ ನೆನಪುಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    waitingMoment: "ಸರಿಯಾದ ಕ್ಷಣಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    opening: "ತೆರೆಯಲಾಗುತ್ತಿದೆ...",
    forLabel: "ಯಾರಿಗಾಗಿ",
    messageFromPast: "ಹಿಂದಿನಿಂದ ಬಂದ ಸಂದೇಶ",
    memoryTypeLabels: {
      personal: "ವೈಯಕ್ತಿಕ",
      college: "ಕಾಲೇಜು",
      family: "ಕುಟುಂಬ",
      friends: "ಸ್ನೇಹಿತರು",
      achievement: "ಸಾಧನೆ",
      project: "ಪ್ರಾಜೆಕ್ಟ್",
      food: "ಆಹಾರ",
      travel: "ಪ್ರಯಾಣ",
      other: "ಇತರೆ",
    },
  },
  Hindi: {
    eyebrow: "भविष्य के लिए एक संदेश",
    heading: "डिजिटल टाइम कैप्सूल",
    intro:
      "एक पत्र, यादें और आवाज़ या फ़ोटो सुरक्षित रखें। चुनें कि कैप्सूल कब खोला जा सकेगा।",
    create: "टाइम कैप्सूल बनाएं",
    title: "कैप्सूल का शीर्षक",
    titleHint: "उदाहरण: मेरे 25वें जन्मदिन पर खोलें",
    recipient: "किसके लिए? (वैकल्पिक)",
    recipientHint: "मेरे भविष्य के लिए, माँ, मेरा परिवार...",
    profile: "प्रोफ़ाइल जोड़ें (वैकल्पिक)",
    noProfile: "कोई प्रोफ़ाइल नहीं",
    unlock: "खुलने की तारीख और समय",
    message: "आपका पत्र या संदेश",
    messageHint:
      "कुछ ऐसा लिखें जिसे आप भविष्य में याद रखना या साझा करना चाहते हैं...",
    attach: "सेव की गई यादें जोड़ें (वैकल्पिक)",
    attachHint: "मौजूदा यादें चुनें। कैप्सूल खुलने तक उनका विवरण छिपा रहेगा।",
    save: "टाइम कैप्सूल सील करें",
    saving: "सील हो रहा है...",
    refresh: "रिफ्रेश",
    yourCapsules: "आपके टाइम कैप्सूल",
    empty: "अभी कोई टाइम कैप्सूल नहीं",
    emptyHint: "अपना पहला कैप्सूल बनाएं और भविष्य के लिए संदेश छोड़ें।",
    sealed: "सील",
    unlocked: "खोलने के लिए तैयार",
    open: "कैप्सूल खोलें",
    delete: "कैप्सूल हटाएं",
    cancel: "रद्द करें",
    lockedHint: "यह कैप्सूल खुलने की तारीख तक सील रहेगा।",
    opensOn: "खुलेगा",
    createdOn: "बनाया गया",
    detail: "कैप्सूल की सामग्री",
    attached: "अंदर की यादें",
    noAttachments: "कोई यादें नहीं जोड़ी गईं।",
    close: "बंद करें",
    confirmDelete: "क्या यह टाइम कैप्सूल स्थायी रूप से हटाएं?",
    created: "आपका टाइम कैप्सूल सील कर दिया गया है।",
    deleted: "टाइम कैप्सूल हटा दिया गया।",
    loadError: "टाइम कैप्सूल लोड नहीं हुए।",
    saveError: "टाइम कैप्सूल नहीं बन सका।",
    openError: "यह कैप्सूल अभी सील है या खोला नहीं जा सका।",
    invalidDate: "भविष्य की तारीख और समय चुनें।",
    note: "खुलने से पहले केवल शीर्षक, प्राप्तकर्ता और खुलने की तारीख दिखाई जाती है। संदेश और यादों का विवरण सर्वर पर छिपा रहता है।",
    days: "दिन",
    hours: "घंटे",
    minutes: "मिनट",
    seconds: "सेकंड",
    chooseProfile: "प्रोफ़ाइल चुनें",
    attachmentCount: "यादें जोड़ी गईं",
    makePromise: "अपने भविष्य के लिए एक वादा करें",
    noSavedMemories: "अभी कोई सेव की गई यादें उपलब्ध नहीं हैं।",
    waitingMoment: "सही पल का इंतज़ार",
    loading: "लोड हो रहा है...",
    opening: "खोला जा रहा है...",
    forLabel: "किसके लिए",
    messageFromPast: "अतीत से एक संदेश",
    memoryTypeLabels: {
      personal: "व्यक्तिगत",
      college: "कॉलेज",
      family: "परिवार",
      friends: "दोस्त",
      achievement: "उपलब्धि",
      project: "प्रोजेक्ट",
      food: "खाना",
      travel: "यात्रा",
      other: "अन्य",
    },
  },
  Tamil: {
    eyebrow: "எதிர்காலத்திற்கான செய்தி",
    heading: "டிஜிட்டல் டைம் கேப்சூல்",
    intro:
      "ஒரு கடிதம், நினைவுகள், குரல் அல்லது புகைப்படங்களைச் சேமித்து, கேப்சூலைத் திறக்கும் நேரத்தைத் தேர்ந்தெடுக்கவும்.",
    create: "டைம் கேப்சூலை உருவாக்கு",
    title: "கேப்சூல் தலைப்பு",
    titleHint: "உதாரணம்: எனது 25வது பிறந்தநாளில் திறக்கவும்",
    recipient: "யாருக்காக? (விருப்பம்)",
    recipientHint: "எதிர்காலத்தில் உள்ள எனக்கு, அம்மா, என் குடும்பம்...",
    profile: "சுயவிவரத்தை இணைக்கவும் (விருப்பம்)",
    noProfile: "சுயவிவரம் இல்லை",
    unlock: "திறக்கும் தேதி மற்றும் நேரம்",
    message: "உங்கள் கடிதம் அல்லது செய்தி",
    messageHint:
      "எதிர்காலத்தில் நினைவுகூர அல்லது பகிர விரும்புவதை எழுதுங்கள்...",
    attach: "சேமித்த நினைவுகளை இணைக்கவும் (விருப்பம்)",
    attachHint:
      "ஏற்கனவே உள்ள நினைவுகளைத் தேர்ந்தெடுக்கவும். கேப்சூல் திறக்கும் வரை அவற்றின் விவரங்கள் மறைக்கப்படும்.",
    save: "டைம் கேப்சூலை மூடு",
    saving: "மூடப்படுகிறது...",
    refresh: "புதுப்பி",
    yourCapsules: "உங்கள் டைம் கேப்சூல்கள்",
    empty: "இன்னும் டைம் கேப்சூல்கள் இல்லை",
    emptyHint: "முதல் கேப்சூலை உருவாக்கி எதிர்காலத்திற்குச் செய்தி விடுங்கள்.",
    sealed: "மூடப்பட்டது",
    unlocked: "திறக்கத் தயாராக உள்ளது",
    open: "கேப்சூலைத் திற",
    delete: "கேப்சூலை நீக்கு",
    cancel: "ரத்து செய்",
    lockedHint: "திறக்கும் தேதி வரும் வரை இந்த கேப்சூல் மூடப்பட்டிருக்கும்.",
    opensOn: "திறக்கும் நாள்",
    createdOn: "உருவாக்கப்பட்டது",
    detail: "கேப்சூல் உள்ளடக்கம்",
    attached: "உள்ளே உள்ள நினைவுகள்",
    noAttachments: "நினைவுகள் எதுவும் இணைக்கப்படவில்லை.",
    close: "மூடு",
    confirmDelete: "இந்த டைம் கேப்சூலை நிரந்தரமாக நீக்கவா?",
    created: "உங்கள் டைம் கேப்சூல் மூடப்பட்டது.",
    deleted: "டைம் கேப்சூல் நீக்கப்பட்டது.",
    loadError: "டைம் கேப்சூல்களை ஏற்ற முடியவில்லை.",
    saveError: "டைம் கேப்சூலை உருவாக்க முடியவில்லை.",
    openError:
      "இந்த கேப்சூல் இன்னும் மூடப்பட்டுள்ளது அல்லது திறக்க முடியவில்லை.",
    invalidDate: "எதிர்கால தேதி மற்றும் நேரத்தைத் தேர்ந்தெடுக்கவும்.",
    note: "திறக்கும் முன் தலைப்பு, பெறுநர் மற்றும் திறக்கும் தேதி மட்டுமே காட்டப்படும். செய்தியும் நினைவுகளின் விவரங்களும் சேவையகத்தில் மறைக்கப்படும்.",
    days: "நாட்கள்",
    hours: "மணிநேரம்",
    minutes: "நிமிடங்கள்",
    seconds: "விநாடிகள்",
    chooseProfile: "சுயவிவரத்தைத் தேர்ந்தெடு",
    attachmentCount: "நினைவுகள் இணைக்கப்பட்டன",
    makePromise: "உங்கள் எதிர்காலத்திற்கான ஒரு வாக்குறுதி",
    noSavedMemories: "சேமிக்கப்பட்ட நினைவுகள் எதுவும் இன்னும் இல்லை.",
    waitingMoment: "சரியான தருணத்திற்காக காத்திருக்கிறது",
    loading: "ஏற்றப்படுகிறது...",
    opening: "திறக்கப்படுகிறது...",
    forLabel: "யாருக்காக",
    messageFromPast: "கடந்த காலத்திலிருந்து ஒரு செய்தி",
    memoryTypeLabels: {
      personal: "தனிப்பட்ட",
      college: "கல்லூரி",
      family: "குடும்பம்",
      friends: "நண்பர்கள்",
      achievement: "சாதனை",
      project: "திட்டம்",
      food: "உணவு",
      travel: "பயணம்",
      other: "மற்றவை",
    },
  },
  Malayalam: {
    eyebrow: "ഭാവിക്കായി ഒരു സന്ദേശം",
    heading: "ഡിജിറ്റൽ ടൈം ക്യാപ്സ്യൂൾ",
    intro:
      "ഒരു കത്ത്, ഓർമ്മകൾ, ശബ്ദം അല്ലെങ്കിൽ ഫോട്ടോകൾ സൂക്ഷിച്ച് ക്യാപ്സ്യൂൾ തുറക്കേണ്ട സമയം തിരഞ്ഞെടുക്കൂ.",
    create: "ടൈം ക്യാപ്സ്യൂൾ സൃഷ്ടിക്കുക",
    title: "ക്യാപ്സ്യൂളിന്റെ പേര്",
    titleHint: "ഉദാഹരണം: എന്റെ 25-ാം ജന്മദിനത്തിൽ തുറക്കുക",
    recipient: "ആർക്കായി? (ഐച്ഛികം)",
    recipientHint: "ഭാവിയിലെ എനിക്ക്, അമ്മ, എന്റെ കുടുംബം...",
    profile: "പ്രൊഫൈൽ ബന്ധിപ്പിക്കുക (ഐച്ഛികം)",
    noProfile: "പ്രൊഫൈൽ ഇല്ല",
    unlock: "തുറക്കുന്ന തീയതിയും സമയവും",
    message: "നിങ്ങളുടെ കത്തോ സന്ദേശമോ",
    messageHint: "ഭാവിയിൽ ഓർക്കാനോ പങ്കിടാനോ ആഗ്രഹിക്കുന്ന കാര്യം എഴുതൂ...",
    attach: "സേവ് ചെയ്ത ഓർമ്മകൾ ചേർക്കുക (ഐച്ഛികം)",
    attachHint:
      "നിലവിലുള്ള ഓർമ്മകൾ തിരഞ്ഞെടുക്കൂ. ക്യാപ്സ്യൂൾ തുറക്കുന്നതുവരെ അവയുടെ വിവരങ്ങൾ മറച്ചുവെക്കും.",
    save: "ടൈം ക്യാപ്സ്യൂൾ സീൽ ചെയ്യുക",
    saving: "സീൽ ചെയ്യുന്നു...",
    refresh: "പുതുക്കുക",
    yourCapsules: "നിങ്ങളുടെ ടൈം ക്യാപ്സ്യൂളുകൾ",
    empty: "ഇതുവരെ ടൈം ക്യാപ്സ്യൂളുകളില്ല",
    emptyHint: "ആദ്യ ക്യാപ്സ്യൂൾ സൃഷ്ടിച്ച് ഭാവിക്കായി ഒരു സന്ദേശം വിടൂ.",
    sealed: "സീൽ ചെയ്തു",
    unlocked: "തുറക്കാൻ തയ്യാറാണ്",
    open: "ക്യാപ്സ്യൂൾ തുറക്കുക",
    delete: "ക്യാപ്സ്യൂൾ ഇല്ലാതാക്കുക",
    cancel: "റദ്ദാക്കുക",
    lockedHint: "തുറക്കുന്ന തീയതി വരെയും ഈ ക്യാപ്സ്യൂൾ സീൽ ചെയ്തിരിക്കും.",
    opensOn: "തുറക്കുന്ന ദിവസം",
    createdOn: "സൃഷ്ടിച്ചത്",
    detail: "ക്യാപ്സ്യൂൾ ഉള്ളടക്കം",
    attached: "അകത്തെ ഓർമ്മകൾ",
    noAttachments: "ഓർമ്മകളൊന്നും ചേർത്തിട്ടില്ല.",
    close: "അടയ്ക്കുക",
    confirmDelete: "ഈ ടൈം ക്യാപ്സ്യൂൾ സ്ഥിരമായി ഇല്ലാതാക്കണോ?",
    created: "നിങ്ങളുടെ ടൈം ക്യാപ്സ്യൂൾ സീൽ ചെയ്തു.",
    deleted: "ടൈം ക്യാപ്സ്യൂൾ ഇല്ലാതാക്കി.",
    loadError: "ടൈം ക്യാപ്സ്യൂളുകൾ ലോഡ് ചെയ്യാനായില്ല.",
    saveError: "ടൈം ക്യാപ്സ്യൂൾ സൃഷ്ടിക്കാനായില്ല.",
    openError:
      "ഈ ക്യാപ്സ്യൂൾ ഇപ്പോഴും സീൽ ചെയ്തിരിക്കുന്നു അല്ലെങ്കിൽ തുറക്കാനായില്ല.",
    invalidDate: "ഭാവിയിലെ തീയതിയും സമയവും തിരഞ്ഞെടുക്കൂ.",
    note: "തുറക്കുന്നതിന് മുമ്പ് പേര്, സ്വീകർത്താവ്, തുറക്കുന്ന തീയതി എന്നിവ മാത്രമേ കാണൂ. സന്ദേശവും ഓർമ്മകളുടെ വിവരങ്ങളും സെർവറിൽ മറച്ചുവെക്കും.",
    days: "ദിവസങ്ങൾ",
    hours: "മണിക്കൂർ",
    minutes: "മിനിറ്റ്",
    seconds: "സെക്കൻഡ്",
    chooseProfile: "പ്രൊഫൈൽ തിരഞ്ഞെടുക്കുക",
    attachmentCount: "ഓർമ്മകൾ ചേർത്തു",
    makePromise: "നിങ്ങളുടെ ഭാവിക്കായി ഒരു വാഗ്ദാനം നൽകൂ",
    noSavedMemories: "ഇതുവരെ സംരക്ഷിച്ച ഓർമ്മകളൊന്നും ലഭ്യമല്ല.",
    waitingMoment: "ശരിയായ നിമിഷത്തിനായി കാത്തിരിക്കുന്നു",
    loading: "ലോഡ് ചെയ്യുന്നു...",
    opening: "തുറക്കുന്നു...",
    forLabel: "ആർക്കായി",
    messageFromPast: "ഭൂതകാലത്തിൽ നിന്നുള്ള ഒരു സന്ദേശം",
    memoryTypeLabels: {
      personal: "വ്യക്തിപരം",
      college: "കോളേജ്",
      family: "കുടുംബം",
      friends: "സുഹൃത്തുക്കൾ",
      achievement: "നേട്ടം",
      project: "പ്രോജക്റ്റ്",
      food: "ഭക്ഷണം",
      travel: "യാത്ര",
      other: "മറ്റുള്ളവ",
    },
  },
};

function parseServerDate(value) {
  if (!value) return null;
  // The API stores UTC timestamps as naive UTC in SQLite and serializes them with Z.
  return new Date(value.endsWith("Z") ? value : `${value}Z`);
}

function formatDate(value, language) {
  const date = parseServerDate(value);
  if (!date || Number.isNaN(date.getTime())) return "—";
  const locale =
    {
      English: "en-IN",
      Kannada: "kn-IN",
      Hindi: "hi-IN",
      Tamil: "ta-IN",
      Malayalam: "ml-IN",
    }[language] || "en-IN";
  return date.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function countdown(value, t) {
  const date = parseServerDate(value);
  if (!date) return "";
  const secondsLeft = Math.max(
    0,
    Math.floor((date.getTime() - Date.now()) / 1000),
  );
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  return `${days} ${t.days} · ${hours} ${t.hours} · ${minutes} ${t.minutes} · ${seconds} ${t.seconds}`;
}

function getMemoryTypeLabel(value, t) {
  const key = String(value || "personal")
    .trim()
    .toLowerCase();
  return (
    t.memoryTypeLabels?.[key] ||
    value ||
    t.memoryTypeLabels?.personal ||
    "Personal"
  );
}

export default function TimeCapsules({
  apiBaseUrl,
  userId,
  profiles = [],
  memories = [],
  language = "English",
}) {
  const t = copy[language] || copy.English;

  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openingId, setOpeningId] = useState(null);
  const [openedCapsule, setOpenedCapsule] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState(Date.now());

  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [profileId, setProfileId] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMemoryIds, setSelectedMemoryIds] = useState([]);

  const minDateTime = useMemo(() => {
    const date = new Date(Date.now() + 60_000);
    date.setSeconds(0, 0);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }, [clock]);

  const loadCapsules = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(
        `${apiBaseUrl}/time-capsules/?user_id=${encodeURIComponent(userId)}`,
      );
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(data.detail || t.loadError);
      }
      setCapsules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || t.loadError);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, userId, t.loadError]);

  useEffect(() => {
    loadCapsules();
  }, [loadCapsules]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!unlockAt || new Date(unlockAt).getTime() <= Date.now()) {
      setError(t.invalidDate);
      return;
    }
    if (!title.trim() || !message.trim()) {
      setError(t.saveError);
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch(`${apiBaseUrl}/time-capsules/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          title: title.trim(),
          recipient: recipient.trim() || null,
          profile_id: profileId ? Number(profileId) : null,
          message: message.trim(),
          unlock_at: new Date(unlockAt).toISOString(),
          memory_ids: selectedMemoryIds.map(Number),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || t.saveError);
      }

      setTitle("");
      setRecipient("");
      setProfileId("");
      setUnlockAt("");
      setMessage("");
      setSelectedMemoryIds([]);
      setNotice(t.created);
      await loadCapsules();
    } catch (err) {
      setError(err.message || t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const toggleMemory = (id) => {
    setSelectedMemoryIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const openCapsule = async (capsule) => {
    setError("");
    setOpeningId(capsule.id);
    try {
      const response = await apiFetch(
        `${apiBaseUrl}/time-capsules/${capsule.id}?user_id=${encodeURIComponent(userId)}`,
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || t.openError);
      }
      if (data.is_locked) {
        throw new Error(t.lockedHint);
      }
      setOpenedCapsule(data);
    } catch (err) {
      setError(err.message || t.openError);
    } finally {
      setOpeningId(null);
    }
  };

  const deleteCapsule = async (capsule) => {
    if (!window.confirm(t.confirmDelete)) return;
    setError("");
    try {
      const response = await apiFetch(
        `${apiBaseUrl}/time-capsules/${capsule.id}?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || t.saveError);
      setNotice(t.deleted);
      setCapsules((items) => items.filter((item) => item.id !== capsule.id));
      if (openedCapsule?.id === capsule.id) setOpenedCapsule(null);
    } catch (err) {
      setError(err.message || t.saveError);
    }
  };

  const readyCapsules = capsules.filter((capsule) => !capsule.is_locked);
  const sealedCapsules = capsules.filter((capsule) => capsule.is_locked);

  return (
    <div className="tc-page">
      <section className="tc-hero">
        <div className="tc-hero-orbit tc-orbit-one" />
        <div className="tc-hero-orbit tc-orbit-two" />
        <div className="tc-hero-copy">
          <span className="tc-eyebrow">{t.eyebrow}</span>
          <h2>{t.heading}</h2>
          <p>{t.intro}</p>
        </div>
        <div className="tc-hero-art" aria-hidden="true">
          <div className="tc-capsule-icon">⌛</div>
          <span className="tc-spark tc-spark-one">✦</span>
          <span className="tc-spark tc-spark-two">✧</span>
        </div>
      </section>

      {error && (
        <div className="tc-alert tc-alert-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="tc-alert tc-alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="tc-layout">
        <section className="tc-card tc-create-card">
          <div className="tc-card-heading">
            <div>
              <span className="tc-eyebrow">{t.makePromise}</span>
              <h3>{t.create}</h3>
            </div>
            <span className="tc-heading-icon">✉</span>
          </div>

          <form onSubmit={handleCreate} className="tc-form">
            <label>
              {t.title}
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t.titleHint}
                maxLength={160}
                required
              />
            </label>

            <label>
              {t.recipient}
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder={t.recipientHint}
                maxLength={120}
              />
            </label>

            <label>
              {t.profile}
              <select
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
              >
                <option value="">{t.noProfile}</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.unlock}
              <input
                type="datetime-local"
                value={unlockAt}
                min={minDateTime}
                onChange={(event) => setUnlockAt(event.target.value)}
                required
              />
            </label>

            <label>
              {t.message}
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t.messageHint}
                rows={6}
                maxLength={10000}
                required
              />
            </label>

            <div className="tc-attachments">
              <div className="tc-attachment-heading">
                <strong>{t.attach}</strong>
                <small>{t.attachHint}</small>
              </div>
              {memories.length === 0 ? (
                <p className="tc-muted">{t.noSavedMemories}</p>
              ) : (
                <div className="tc-memory-picker">
                  {memories.map((memory) => (
                    <label className="tc-memory-option" key={memory.id}>
                      <input
                        type="checkbox"
                        checked={selectedMemoryIds.includes(memory.id)}
                        onChange={() => toggleMemory(memory.id)}
                      />
                      <span className="tc-memory-kind">
                        {memory.image_url ? "▧" : memory.audio_url ? "♫" : "✧"}
                      </span>
                      <span className="tc-memory-name">
                        <strong>{memory.title}</strong>
                        <small>
                          {getMemoryTypeLabel(memory.memory_type, t)}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="tc-security-note">
              <span>🔒</span>
              <p>{t.note}</p>
            </div>

            <button
              type="submit"
              className="primary-button tc-submit"
              disabled={saving}
            >
              {saving ? t.saving : t.save}
            </button>
          </form>
        </section>

        <section className="tc-card tc-list-card">
          <div className="tc-card-heading">
            <div>
              <span className="tc-eyebrow">{t.waitingMoment}</span>
              <h3>{t.yourCapsules}</h3>
            </div>
            <button
              type="button"
              className="tc-refresh"
              onClick={loadCapsules}
              disabled={loading}
            >
              ↻ {t.refresh}
            </button>
          </div>

          {loading ? (
            <div className="tc-empty">
              <span className="tc-empty-icon">⌛</span>
              <p>{t.loading}</p>
            </div>
          ) : capsules.length === 0 ? (
            <div className="tc-empty">
              <span className="tc-empty-icon">✉</span>
              <h4>{t.empty}</h4>
              <p>{t.emptyHint}</p>
            </div>
          ) : (
            <div className="tc-capsule-list">
              {[...readyCapsules, ...sealedCapsules].map((capsule) => (
                <article
                  className={`tc-capsule-item ${capsule.is_locked ? "is-sealed" : "is-ready"}`}
                  key={capsule.id}
                >
                  <div className="tc-capsule-item-top">
                    <span
                      className={`tc-status ${capsule.is_locked ? "sealed" : "ready"}`}
                    >
                      {capsule.is_locked ? `🔒 ${t.sealed}` : `✦ ${t.unlocked}`}
                    </span>
                    <button
                      type="button"
                      className="tc-delete"
                      onClick={() => deleteCapsule(capsule)}
                      aria-label={t.delete}
                    >
                      ×
                    </button>
                  </div>
                  <h4>{capsule.title}</h4>
                  {capsule.recipient && (
                    <p className="tc-recipient">
                      {t.forLabel}: {capsule.recipient}
                    </p>
                  )}
                  <div className="tc-date-line">
                    <span>{t.opensOn}</span>
                    <strong>{formatDate(capsule.unlock_at, language)}</strong>
                  </div>
                  {capsule.is_locked ? (
                    <>
                      <div className="tc-countdown">
                        {countdown(capsule.unlock_at, t)}
                      </div>
                      <p className="tc-locked-hint">{t.lockedHint}</p>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="primary-button tc-open-button"
                      disabled={openingId === capsule.id}
                      onClick={() => openCapsule(capsule)}
                    >
                      {openingId === capsule.id ? t.opening : t.open}
                    </button>
                  )}
                  <small className="tc-created">
                    {t.createdOn}: {formatDate(capsule.created_at, language)}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {openedCapsule && (
        <div
          className="tc-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpenedCapsule(null);
          }}
        >
          <section
            className="tc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tc-modal-title"
          >
            <button
              type="button"
              className="tc-modal-close"
              onClick={() => setOpenedCapsule(null)}
              aria-label={t.close}
            >
              ×
            </button>
            <span className="tc-eyebrow">{t.messageFromPast}</span>
            <h2 id="tc-modal-title">{openedCapsule.title}</h2>
            {openedCapsule.recipient && (
              <p className="tc-modal-recipient">
                {t.forLabel}: {openedCapsule.recipient}
              </p>
            )}
            <p className="tc-modal-date">
              {t.createdOn}: {formatDate(openedCapsule.created_at, language)}
            </p>
            <div className="tc-letter">{openedCapsule.message}</div>

            <div className="tc-modal-memories">
              <h3>{t.attached}</h3>
              {(openedCapsule.memories || []).length === 0 ? (
                <p className="tc-muted">{t.noAttachments}</p>
              ) : (
                <div className="tc-opened-memory-list">
                  {openedCapsule.memories.map((memory) => (
                    <article className="tc-opened-memory" key={memory.id}>
                      {memory.image_url && (
                        <AuthenticatedImage
                          src={`${apiBaseUrl}${memory.image_url}`}
                          alt={memory.title}
                        />
                      )}
                      <div>
                        <strong>{memory.title}</strong>
                        <small>
                          {getMemoryTypeLabel(memory.memory_type, t)}
                        </small>
                        <p>{memory.content}</p>
                        {memory.audio_url && (
                          <AuthenticatedAudio
                            controls
                            preload="none"
                            src={`${apiBaseUrl}${memory.audio_url}`}
                          />
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="primary-button tc-modal-done"
              onClick={() => setOpenedCapsule(null)}
            >
              {t.close}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
