import { useCallback, useEffect, useState } from "react";
import "./App.css";
import VoiceRecorder from "./VoiceRecorder";

const API = "http://127.0.0.1:8001";

function App() {
  // =====================================================
  // AUTH
  // =====================================================

  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("loggedIn") === "true",
  );

  const [showSignup, setShowSignup] = useState(false);

  const [authEmail, setAuthEmail] = useState(
    localStorage.getItem("email") || "",
  );

  const [authUsername, setAuthUsername] = useState(
    localStorage.getItem("username") || "",
  );

  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [userId, setUserId] = useState(
    Number(localStorage.getItem("user_id")) || null,
  );

  // =====================================================
  // MEMORY
  // =====================================================

  const [memories, setMemories] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [memoryType, setMemoryType] = useState("personal");
  const [memoryTypeFilter, setMemoryTypeFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const [saving, setSaving] = useState(false);
  const [memoryMessage, setMemoryMessage] = useState("");

  // =====================================================
  // IMAGE
  // =====================================================

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // =====================================================
  // AUDIO
  // =====================================================

  const [selectedAudio, setSelectedAudio] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // =====================================================
  // EDIT
  // =====================================================

  const [editingMemoryId, setEditingMemoryId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editMemoryType, setEditMemoryType] = useState("personal");
  const [editProfileId, setEditProfileId] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // =====================================================
  // AI CHAT
  // =====================================================

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [chatProfileId, setChatProfileId] = useState("");
  // =====================================================
  // RELATIONSHIP PROFILES
  // =====================================================

  const [profiles, setProfiles] = useState([]);
  const [activeProfileFilter, setActiveProfileFilter] = useState(null);
  const [timelineProfileId, setTimelineProfileId] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [identitySummaries, setIdentitySummaries] = useState({});
  const [identityLoadingId, setIdentityLoadingId] = useState(null);
  const [identityErrors, setIdentityErrors] = useState({});
  const [lifeStories, setLifeStories] = useState({});
  const [lifeStoryLoadingId, setLifeStoryLoadingId] = useState(null);
  const [lifeStoryErrors, setLifeStoryErrors] = useState({});
  const [profileName, setProfileName] = useState("");
  const [profileRelationship, setProfileRelationship] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // =====================================================
  // LANGUAGE
  // =====================================================

  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "English",
  );

  const languages = [
    {
      name: "English",
      code: "en",
      native: "English",
    },
    {
      name: "Kannada",
      code: "kn",
      native: "ಕನ್ನಡ",
    },
    {
      name: "Hindi",
      code: "hi",
      native: "हिन्दी",
    },
    {
      name: "Tamil",
      code: "ta",
      native: "தமிழ்",
    },
    {
      name: "Malayalam",
      code: "ml",
      native: "മലയാളം",
    },
  ];

  // =====================================================
  // TRANSLATIONS
  // =====================================================

  const translations = {
    English: {
      home: "Home",
      features: "Features",
      memories: "Memories",
      about: "About",
      logout: "Logout",

      welcome: "Welcome back",
      startJourney: "Start your memory journey",
      preserveStory: "Preserve Your Story",
      welcomeText: "Keep your precious memories safe and talk to them anytime.",
      createAccount: "Create Your Account",
      createText:
        "Create a private space for your stories, photos and voice memories.",

      login: "Login →",
      creating: "Creating...",
      loggingIn: "Logging in...",
      signup: "Don't have an account? Sign up",
      alreadyAccount: "Already have an account? Login",

      aiPowered: "AI Powered Memory Keeper",
      heroTitle: "Your Memories. Your Legacy.",
      heroText:
        "Living Memory AI helps you preserve your precious memories, stories, photos and voices in one secure place and lets you relive them anytime.",

      getStarted: "Get Started →",
      learnMore: "▶ Learn More",

      preserveMoments: "Preserve the moments",
      thatMatter: "that matter most.",

      aiMemoryChat: "AI Memory Chat",
      askPast: "Ask about your past.",

      voiceMemoryCard: "Voice Memory",
      recordMoments: "Record precious moments.",

      photoMemoryCard: "Photo Memory",
      keepVisual: "Keep memories visual.",

      privateMemories: "Private Memories",
      secureAlways: "Secure. Private. Always yours.",

      featuresTitle: "Everything Your Memories Need",

      textMemories: "Text Memories",
      textMemoriesDesc:
        "Write down your thoughts, stories and special moments.",

      photoMemories: "Photo Memories",
      photoMemoriesDesc: "Upload and store photos safely with your memories.",

      voiceMemories: "Voice Memories",
      voiceMemoriesDesc: "Record your precious words and conversations.",

      aiChat: "AI Chat",
      aiChatDesc: "Talk with your memories using AI and revisit the past.",

      smartSearch: "Smart Search",
      smartSearchDesc: "Find your memories quickly using keywords.",

      secure: "Secure & Private",
      secureDesc: "Your memories stay connected to your personal account.",

      memoriesSaved: "Memories Saved",
      memoryFormats: "Memory Formats",
      memoryAssistant: "Memory Assistant",
      storyAvailable: "Your Story Available",

      talkMemories: "Talk to Your Memories",
      aiResponses: "AI responses:",
      askPlaceholder: "Ask something about your memories...",
      askAI: "Ask Living Memory AI",
      thinking: "Thinking...",
      askAnything: "Ask me anything about your saved memories.",

      findMemory: "Find a Memory",
      searchPlaceholder: "Search your memories...",
      noResults: "No matching memories found.",
      searchResultsFor: "Results for",

      saveMemory: "Save a New Memory",
      titlePlaceholder: "Give your memory a title...",
      memoryPlaceholder: "Write your memory here...",
      addPhoto: "📸 Add a Photo",
      removePhoto: "❌ Remove Photo",
      save: "Save Memory 💜",
      saving: "Saving...",

      myMemories: "My Memories",
      refresh: "🔄 Refresh",
      waiting: "Your memory collection is waiting ✨",
      firstMemory: "Save your first special moment above.",

      edit: "✏️ Edit",
      delete: "🗑️ Delete",
      editMemory: "✏️ Edit Memory",
      saveChanges: "💾 Save Changes",
      cancel: "Cancel",

      titleLabel: "Title",
      memoryTypeLabel: "Memory Type",
      memoryLabel: "Memory",
      voiceMemoryLabel: "Voice Memory",

      aboutTitle: "🌟 About Living Memory AI",
      aboutText:
        "A personal digital space where your stories, photos and voice memories can be preserved and explored through AI.",

      memoryStorage: "Memory Storage",
      memoryStorageDesc: "Save important personal memories.",

      voiceMemory: "Voice Memory",
      voiceMemoryDesc: "Speak your memories instead of typing.",

      photoMemory: "Photo Memories",
      photoMemoryDesc: "Attach photos to meaningful moments.",

      aiConversation: "AI Conversation",
      aiConversationDesc: "Ask questions about your saved memories.",

      memoriesLive: "Memories live forever.",
      footerCopy: "© 2026 Living Memory AI — Your memories, your story.",

      personal: "Personal",
      college: "College",
      family: "Family",
      friends: "Friends",
      achievement: "Achievement",
      project: "Project",
      food: "Food",
      travel: "Travel",
      other: "Other",

      email: "Email",
      password: "Password",
      username: "Username",

      you: "You",

      quickQuestions: [
        "What project am I currently working on?",
        "Tell me about my college journey.",
        "What are some important things I have saved?",
      ],

      voiceRecorded: "🎤 Voice recorded. Save the memory.",

      voiceReady: "🎤 Voice recording ready to save.",
    },

    Kannada: {
      home: "ಮುಖಪುಟ",
      features: "ವೈಶಿಷ್ಟ್ಯಗಳು",
      memories: "ನೆನಪುಗಳು",
      about: "ನಮ್ಮ ಬಗ್ಗೆ",
      logout: "ಲಾಗ್ ಔಟ್",

      welcome: "ಮತ್ತೆ ಸ್ವಾಗತ",
      startJourney: "ನಿಮ್ಮ ನೆನಪಿನ ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ",
      preserveStory: "ನಿಮ್ಮ ಕಥೆಯನ್ನು ಉಳಿಸಿ",
      welcomeText:
        "ನಿಮ್ಮ ಅಮೂಲ್ಯ ನೆನಪುಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಿ ಮತ್ತು ಯಾವಾಗ ಬೇಕಾದರೂ ಅವುಗಳೊಂದಿಗೆ ಮಾತನಾಡಿ.",
      createAccount: "ಖಾತೆ ರಚಿಸಿ",
      createText:
        "ನಿಮ್ಮ ಕಥೆಗಳು, ಫೋಟೋಗಳು ಮತ್ತು ಧ್ವನಿ ನೆನಪುಗಳಿಗಾಗಿ ಖಾಸಗಿ ಸ್ಥಳವನ್ನು ರಚಿಸಿ.",

      login: "ಲಾಗಿನ್ →",
      creating: "ರಚಿಸಲಾಗುತ್ತಿದೆ...",
      loggingIn: "ಲಾಗಿನ್ ಆಗುತ್ತಿದೆ...",
      signup: "ಖಾತೆ ಇಲ್ಲವೇ? ಸೈನ್ ಅಪ್ ಮಾಡಿ",
      alreadyAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗಿನ್ ಮಾಡಿ",

      aiPowered: "AI ಆಧಾರಿತ ನೆನಪು ಸಂರಕ್ಷಕ",
      heroTitle: "ನಿಮ್ಮ ನೆನಪುಗಳು. ನಿಮ್ಮ ಪರಂಪರೆ.",
      heroText:
        "Living Memory AI ನಿಮ್ಮ ಅಮೂಲ್ಯ ನೆನಪುಗಳು, ಕಥೆಗಳು, ಫೋಟೋಗಳು ಮತ್ತು ಧ್ವನಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",

      getStarted: "ಪ್ರಾರಂಭಿಸಿ →",
      learnMore: "▶ ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ",

      preserveMoments: "ಅಮೂಲ್ಯ ಕ್ಷಣಗಳನ್ನು ಉಳಿಸಿ",
      thatMatter: "ಅವು ನಿಮಗೆ ಸದಾ ನೆನಪಾಗಿರಲಿ.",

      aiMemoryChat: "AI ನೆನಪು ಚಾಟ್",
      askPast: "ನಿಮ್ಮ ಹಿಂದಿನ ಬಗ್ಗೆ ಕೇಳಿ.",

      voiceMemoryCard: "ಧ್ವನಿ ನೆನಪು",
      recordMoments: "ಅಮೂಲ್ಯ ಕ್ಷಣಗಳನ್ನು ದಾಖಲಿಸಿ.",

      photoMemoryCard: "ಫೋಟೋ ನೆನಪು",
      keepVisual: "ನೆನಪುಗಳನ್ನು ಚಿತ್ರಗಳಾಗಿ ಉಳಿಸಿ.",

      privateMemories: "ಖಾಸಗಿ ನೆನಪುಗಳು",
      secureAlways: "ಸುರಕ್ಷಿತ. ಖಾಸಗಿ. ಯಾವಾಗಲೂ ನಿಮ್ಮದು.",

      featuresTitle: "ನಿಮ್ಮ ನೆನಪುಗಳಿಗೆ ಬೇಕಾದ ಎಲ್ಲವೂ",

      textMemories: "ಪಠ್ಯ ನೆನಪುಗಳು",
      textMemoriesDesc:
        "ನಿಮ್ಮ ಆಲೋಚನೆಗಳು, ಕಥೆಗಳು ಮತ್ತು ವಿಶೇಷ ಕ್ಷಣಗಳನ್ನು ಬರೆಯಿರಿ.",

      photoMemories: "ಫೋಟೋ ನೆನಪುಗಳು",
      photoMemoriesDesc: "ನಿಮ್ಮ ನೆನಪುಗಳೊಂದಿಗೆ ಫೋಟೋಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಿ.",

      voiceMemories: "ಧ್ವನಿ ನೆನಪುಗಳು",
      voiceMemoriesDesc: "ನಿಮ್ಮ ಅಮೂಲ್ಯ ಮಾತುಗಳು ಮತ್ತು ಸಂಭಾಷಣೆಗಳನ್ನು ದಾಖಲಿಸಿ.",

      aiChat: "AI ಚಾಟ್",
      aiChatDesc: "AI ಮೂಲಕ ನಿಮ್ಮ ನೆನಪುಗಳೊಂದಿಗೆ ಮಾತನಾಡಿ.",

      smartSearch: "ಸ್ಮಾರ್ಟ್ ಹುಡುಕಾಟ",
      smartSearchDesc: "ಕೀವರ್ಡ್‌ಗಳ ಮೂಲಕ ನಿಮ್ಮ ನೆನಪುಗಳನ್ನು ವೇಗವಾಗಿ ಹುಡುಕಿ.",

      secure: "ಸುರಕ್ಷಿತ ಮತ್ತು ಖಾಸಗಿ",
      secureDesc: "ನಿಮ್ಮ ನೆನಪುಗಳು ನಿಮ್ಮ ಖಾಸಗಿ ಖಾತೆಯಲ್ಲೇ ಸುರಕ್ಷಿತವಾಗಿರುತ್ತವೆ.",

      memoriesSaved: "ಉಳಿಸಿದ ನೆನಪುಗಳು",
      memoryFormats: "ನೆನಪಿನ ಸ್ವರೂಪಗಳು",
      memoryAssistant: "ನೆನಪು ಸಹಾಯಕ",
      storyAvailable: "ನಿಮ್ಮ ಕಥೆ ಲಭ್ಯವಿದೆ",

      talkMemories: "ನಿಮ್ಮ ನೆನಪುಗಳೊಂದಿಗೆ ಮಾತನಾಡಿ",
      aiResponses: "AI ಉತ್ತರಗಳು:",
      askPlaceholder: "ನಿಮ್ಮ ನೆನಪುಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ...",
      askAI: "Living Memory AI ಅನ್ನು ಕೇಳಿ",
      thinking: "ಯೋಚಿಸುತ್ತಿದೆ...",
      askAnything: "ನಿಮ್ಮ ಉಳಿಸಿದ ನೆನಪುಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ.",

      findMemory: "ನೆನಪು ಹುಡುಕಿ",
      searchPlaceholder: "ನಿಮ್ಮ ನೆನಪುಗಳನ್ನು ಹುಡುಕಿ...",
      noResults: "ಯಾವುದೇ ನೆನಪುಗಳು ಕಂಡುಬಂದಿಲ್ಲ.",
      searchResultsFor: "ಫಲಿತಾಂಶಗಳು",

      saveMemory: "ಹೊಸ ನೆನಪು ಉಳಿಸಿ",
      titlePlaceholder: "ನಿಮ್ಮ ನೆನಪಿಗೆ ಶೀರ್ಷಿಕೆ ನೀಡಿ...",
      memoryPlaceholder: "ನಿಮ್ಮ ನೆನಪನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...",
      addPhoto: "📸 ಫೋಟೋ ಸೇರಿಸಿ",
      removePhoto: "❌ ಫೋಟೋ ತೆಗೆದುಹಾಕಿ",
      save: "ನೆನಪು ಉಳಿಸಿ 💜",
      saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...",

      myMemories: "ನನ್ನ ನೆನಪುಗಳು",
      refresh: "🔄 ರಿಫ್ರೆಶ್",
      waiting: "ನಿಮ್ಮ ನೆನಪುಗಳ ಸಂಗ್ರಹ ಕಾಯುತ್ತಿದೆ ✨",
      firstMemory: "ಮೇಲೆ ನಿಮ್ಮ ಮೊದಲ ವಿಶೇಷ ಕ್ಷಣವನ್ನು ಉಳಿಸಿ.",

      edit: "✏️ ಸಂಪಾದಿಸಿ",
      delete: "🗑️ ಅಳಿಸಿ",
      editMemory: "✏️ ನೆನಪು ಸಂಪಾದಿಸಿ",
      saveChanges: "💾 ಬದಲಾವಣೆ ಉಳಿಸಿ",
      cancel: "ರದ್ದುಮಾಡಿ",

      titleLabel: "ಶೀರ್ಷಿಕೆ",
      memoryTypeLabel: "ನೆನಪಿನ ಪ್ರಕಾರ",
      memoryLabel: "ನೆನಪು",
      voiceMemoryLabel: "ಧ್ವನಿ ನೆನಪು",

      aboutTitle: "🌟 Living Memory AI ಬಗ್ಗೆ",
      aboutText:
        "ನಿಮ್ಮ ಕಥೆಗಳು, ಫೋಟೋಗಳು ಮತ್ತು ಧ್ವನಿ ನೆನಪುಗಳನ್ನು AI ಮೂಲಕ ಉಳಿಸಿ ಮತ್ತು ಅನುಭವಿಸುವ ವೈಯಕ್ತಿಕ ಡಿಜಿಟಲ್ ಸ್ಥಳ.",

      memoryStorage: "ನೆನಪು ಸಂಗ್ರಹ",
      memoryStorageDesc: "ಮುಖ್ಯ ವೈಯಕ್ತಿಕ ನೆನಪುಗಳನ್ನು ಉಳಿಸಿ.",

      voiceMemory: "ಧ್ವನಿ ನೆನಪು",
      voiceMemoryDesc: "ಟೈಪ್ ಮಾಡುವ ಬದಲು ನಿಮ್ಮ ನೆನಪುಗಳನ್ನು ಮಾತನಾಡಿ.",

      photoMemory: "ಫೋಟೋ ನೆನಪುಗಳು",
      photoMemoryDesc: "ಅರ್ಥಪೂರ್ಣ ಕ್ಷಣಗಳಿಗೆ ಫೋಟೋಗಳನ್ನು ಸೇರಿಸಿ.",

      aiConversation: "AI ಸಂಭಾಷಣೆ",
      aiConversationDesc: "ನಿಮ್ಮ ಉಳಿಸಿದ ನೆನಪುಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.",

      memoriesLive: "ನೆನಪುಗಳು ಸದಾ ಜೀವಂತವಾಗಿರುತ್ತವೆ.",

      footerCopy: "© 2026 Living Memory AI — ನಿಮ್ಮ ನೆನಪುಗಳು, ನಿಮ್ಮ ಕಥೆ.",

      personal: "ವೈಯಕ್ತಿಕ",
      college: "ಕಾಲೇಜು",
      family: "ಕುಟುಂಬ",
      friends: "ಸ್ನೇಹಿತರು",
      achievement: "ಸಾಧನೆ",
      project: "ಪ್ರಾಜೆಕ್ಟ್",
      food: "ಆಹಾರ",
      travel: "ಪ್ರಯಾಣ",
      other: "ಇತರೆ",

      email: "ಇಮೇಲ್",
      password: "ಪಾಸ್‌ವರ್ಡ್",
      username: "ಬಳಕೆದಾರ ಹೆಸರು",

      you: "ನೀವು",

      quickQuestions: [
        "ನಾನು ಪ್ರಸ್ತುತ ಯಾವ ಪ್ರಾಜೆಕ್ಟ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೇನೆ?",
        "ನನ್ನ ಕಾಲೇಜು ಪ್ರಯಾಣದ ಬಗ್ಗೆ ಹೇಳಿ.",
        "ನಾನು ಉಳಿಸಿರುವ ಕೆಲವು ಪ್ರಮುಖ ವಿಷಯಗಳು ಯಾವುವು?",
      ],

      voiceRecorded: "🎤 ಧ್ವನಿ ದಾಖಲಾಗಿದೆ. ನೆನಪನ್ನು ಉಳಿಸಿ.",

      voiceReady: "🎤 ಧ್ವನಿ ದಾಖಲೆ ಉಳಿಸಲು ಸಿದ್ಧವಾಗಿದೆ.",
    },

    Hindi: {
      home: "होम",
      features: "फीचर्स",
      memories: "यादें",
      about: "हमारे बारे में",
      logout: "लॉग आउट",

      welcome: "वापसी पर स्वागत है",
      startJourney: "अपनी यादों की यात्रा शुरू करें",
      preserveStory: "अपनी कहानी सुरक्षित रखें",
      welcomeText: "अपनी अनमोल यादों को सुरक्षित रखें और उनसे कभी भी बात करें।",
      createAccount: "खाता बनाएं",
      createText:
        "अपनी कहानियों, तस्वीरों और आवाज़ की यादों के लिए एक निजी स्थान बनाएं।",

      login: "लॉगिन →",
      creating: "बनाया जा रहा है...",
      loggingIn: "लॉगिन हो रहा है...",
      signup: "खाता नहीं है? साइन अप करें",
      alreadyAccount: "पहले से खाता है? लॉगिन करें",

      aiPowered: "AI पावर्ड मेमोरी कीपर",
      heroTitle: "आपकी यादें। आपकी विरासत।",
      heroText:
        "Living Memory AI आपकी यादों, कहानियों, तस्वीरों और आवाज़ों को सुरक्षित रखने में मदद करता है।",

      getStarted: "शुरू करें →",
      learnMore: "▶ और जानें",

      preserveMoments: "उन पलों को सुरक्षित रखें",
      thatMatter: "जो आपके लिए सबसे खास हैं।",

      aiMemoryChat: "AI मेमोरी चैट",
      askPast: "अपने अतीत के बारे में पूछें।",

      voiceMemoryCard: "वॉइस मेमोरी",
      recordMoments: "खास पलों को रिकॉर्ड करें।",

      photoMemoryCard: "फोटो मेमोरी",
      keepVisual: "यादों को तस्वीरों के रूप में रखें।",

      privateMemories: "निजी यादें",
      secureAlways: "सुरक्षित। निजी। हमेशा आपकी।",

      featuresTitle: "आपकी यादों के लिए सब कुछ",

      textMemories: "टेक्स्ट यादें",
      textMemoriesDesc: "अपने विचार, कहानियां और खास पल लिखें।",

      photoMemories: "फोटो यादें",
      photoMemoriesDesc: "अपनी यादों के साथ तस्वीरें सुरक्षित रखें।",

      voiceMemories: "आवाज़ की यादें",
      voiceMemoriesDesc: "अपनी खास बातें और बातचीत रिकॉर्ड करें।",

      aiChat: "AI चैट",
      aiChatDesc: "AI की मदद से अपनी यादों से बात करें।",

      smartSearch: "स्मार्ट सर्च",
      smartSearchDesc: "कीवर्ड की मदद से अपनी यादें जल्दी खोजें।",

      secure: "सुरक्षित और निजी",
      secureDesc: "आपकी यादें आपके निजी अकाउंट में सुरक्षित रहती हैं।",

      memoriesSaved: "सेव की गई यादें",
      memoryFormats: "यादों के फॉर्मेट",
      memoryAssistant: "मेमोरी असिस्टेंट",
      storyAvailable: "आपकी कहानी उपलब्ध है",

      talkMemories: "अपनी यादों से बात करें",
      aiResponses: "AI उत्तर:",
      askPlaceholder: "अपनी यादों के बारे में कुछ पूछें...",
      askAI: "Living Memory AI से पूछें",
      thinking: "सोच रहा है...",
      askAnything: "अपनी सेव की गई यादों के बारे में कुछ भी पूछें।",

      findMemory: "याद खोजें",
      searchPlaceholder: "अपनी यादें खोजें...",
      noResults: "कोई याद नहीं मिली।",
      searchResultsFor: "परिणाम",

      saveMemory: "नई याद सेव करें",
      titlePlaceholder: "अपनी याद को एक शीर्षक दें...",
      memoryPlaceholder: "अपनी याद यहां लिखें...",
      addPhoto: "📸 फोटो जोड़ें",
      removePhoto: "❌ फोटो हटाएं",
      save: "याद सेव करें 💜",
      saving: "सेव हो रहा है...",

      myMemories: "मेरी यादें",
      refresh: "🔄 रिफ्रेश",
      waiting: "आपकी यादों का संग्रह आपका इंतजार कर रहा है ✨",
      firstMemory: "ऊपर अपनी पहली खास याद सेव करें।",

      edit: "✏️ एडिट",
      delete: "🗑️ डिलीट",
      editMemory: "✏️ याद एडिट करें",
      saveChanges: "💾 बदलाव सेव करें",
      cancel: "रद्द करें",

      titleLabel: "शीर्षक",
      memoryTypeLabel: "याद का प्रकार",
      memoryLabel: "याद",
      voiceMemoryLabel: "वॉइस मेमोरी",

      aboutTitle: "🌟 Living Memory AI के बारे में",
      aboutText:
        "आपकी कहानियों, तस्वीरों और आवाज़ की यादों को AI के माध्यम से सुरक्षित रखने का निजी डिजिटल स्थान।",

      memoryStorage: "मेमोरी स्टोरेज",
      memoryStorageDesc: "महत्वपूर्ण व्यक्तिगत यादें सेव करें।",

      voiceMemory: "वॉइस मेमोरी",
      voiceMemoryDesc: "टाइप करने के बजाय अपनी यादें बोलें।",

      photoMemory: "फोटो यादें",
      photoMemoryDesc: "खास पलों के साथ तस्वीरें जोड़ें।",

      aiConversation: "AI बातचीत",
      aiConversationDesc: "अपनी सेव की गई यादों के बारे में सवाल पूछें।",

      memoriesLive: "यादें हमेशा जीवित रहती हैं।",

      footerCopy: "© 2026 Living Memory AI — आपकी यादें, आपकी कहानी।",

      personal: "व्यक्तिगत",
      college: "कॉलेज",
      family: "परिवार",
      friends: "दोस्त",
      achievement: "उपलब्धि",
      project: "प्रोजेक्ट",
      food: "खाना",
      travel: "यात्रा",
      other: "अन्य",

      email: "ईमेल",
      password: "पासवर्ड",
      username: "यूज़रनेम",

      you: "आप",

      quickQuestions: [
        "मैं अभी किस प्रोजेक्ट पर काम कर रहा/रही हूँ?",
        "मेरी कॉलेज यात्रा के बारे में बताएं।",
        "मैंने कौन-सी महत्वपूर्ण चीजें सेव की हैं?",
      ],

      voiceRecorded: "🎤 आवाज़ रिकॉर्ड हो गई। याद सेव करें।",

      voiceReady: "🎤 वॉइस रिकॉर्डिंग सेव करने के लिए तैयार है।",
    },

    Tamil: {
      home: "முகப்பு",
      features: "அம்சங்கள்",
      memories: "நினைவுகள்",
      about: "எங்களை பற்றி",
      logout: "வெளியேறு",

      welcome: "மீண்டும் வரவேற்கிறோம்",
      startJourney: "உங்கள் நினைவுப் பயணத்தை தொடங்குங்கள்",
      preserveStory: "உங்கள் கதையை பாதுகாக்கவும்",
      welcomeText:
        "உங்கள் மதிப்புமிக்க நினைவுகளை பாதுகாப்பாக சேமித்து எப்போது வேண்டுமானாலும் அவற்றுடன் பேசுங்கள்.",
      createAccount: "கணக்கை உருவாக்கவும்",
      createText:
        "உங்கள் கதைகள், புகைப்படங்கள் மற்றும் குரல் நினைவுகளுக்கான தனிப்பட்ட இடத்தை உருவாக்குங்கள்.",

      login: "உள்நுழைவு →",
      creating: "உருவாக்கப்படுகிறது...",
      loggingIn: "உள்நுழைகிறது...",
      signup: "கணக்கு இல்லையா? பதிவு செய்யுங்கள்",
      alreadyAccount: "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையுங்கள்",

      aiPowered: "AI நினைவு பாதுகாப்பாளர்",
      heroTitle: "உங்கள் நினைவுகள். உங்கள் பாரம்பரியம்.",
      heroText:
        "Living Memory AI உங்கள் நினைவுகள், கதைகள், புகைப்படங்கள் மற்றும் குரல்களை பாதுகாப்பாக சேமிக்க உதவுகிறது.",

      getStarted: "தொடங்குங்கள் →",
      learnMore: "▶ மேலும் அறிக",

      preserveMoments: "முக்கியமான தருணங்களை பாதுகாக்கவும்",
      thatMatter: "அவை எப்போதும் நினைவில் இருக்கட்டும்.",

      aiMemoryChat: "AI நினைவு அரட்டை",
      askPast: "உங்கள் கடந்த காலத்தைப் பற்றி கேளுங்கள்.",

      voiceMemoryCard: "குரல் நினைவு",
      recordMoments: "முக்கியமான தருணங்களை பதிவு செய்யுங்கள்.",

      photoMemoryCard: "புகைப்பட நினைவு",
      keepVisual: "நினைவுகளை படங்களாக பாதுகாக்கவும்.",

      privateMemories: "தனிப்பட்ட நினைவுகள்",
      secureAlways: "பாதுகாப்பானது. தனிப்பட்டது. எப்போதும் உங்களுடையது.",

      featuresTitle: "உங்கள் நினைவுகளுக்கு தேவையான அனைத்தும்",

      textMemories: "உரை நினைவுகள்",
      textMemoriesDesc:
        "உங்கள் எண்ணங்கள், கதைகள் மற்றும் சிறப்பு தருணங்களை எழுதுங்கள்.",

      photoMemories: "புகைப்பட நினைவுகள்",
      photoMemoriesDesc:
        "உங்கள் நினைவுகளுடன் புகைப்படங்களை பாதுகாப்பாக சேமியுங்கள்.",

      voiceMemories: "குரல் நினைவுகள்",
      voiceMemoriesDesc:
        "உங்கள் முக்கியமான வார்த்தைகள் மற்றும் உரையாடல்களை பதிவு செய்யுங்கள்.",

      aiChat: "AI அரட்டை",
      aiChatDesc: "AI மூலம் உங்கள் நினைவுகளுடன் பேசுங்கள்.",

      smartSearch: "ஸ்மார்ட் தேடல்",
      smartSearchDesc:
        "முக்கிய சொற்களைப் பயன்படுத்தி நினைவுகளை விரைவாகக் கண்டறியுங்கள்.",

      secure: "பாதுகாப்பானது மற்றும் தனிப்பட்டது",
      secureDesc:
        "உங்கள் நினைவுகள் உங்கள் தனிப்பட்ட கணக்கில் பாதுகாப்பாக இருக்கும்.",

      memoriesSaved: "சேமிக்கப்பட்ட நினைவுகள்",
      memoryFormats: "நினைவு வடிவங்கள்",
      memoryAssistant: "நினைவு உதவியாளர்",
      storyAvailable: "உங்கள் கதை கிடைக்கிறது",

      talkMemories: "உங்கள் நினைவுகளுடன் பேசுங்கள்",
      aiResponses: "AI பதில்கள்:",
      askPlaceholder: "உங்கள் நினைவுகளைப் பற்றி ஏதாவது கேளுங்கள்...",
      askAI: "Living Memory AI-யிடம் கேளுங்கள்",
      thinking: "யோசிக்கிறது...",
      askAnything: "சேமித்த நினைவுகளைப் பற்றி ஏதாவது கேளுங்கள்.",

      findMemory: "நினைவைத் தேடுங்கள்",
      searchPlaceholder: "உங்கள் நினைவுகளைத் தேடுங்கள்...",
      noResults: "பொருத்தமான நினைவுகள் எதுவும் கிடைக்கவில்லை.",
      searchResultsFor: "முடிவுகள்",

      saveMemory: "புதிய நினைவை சேமிக்கவும்",
      titlePlaceholder: "உங்கள் நினைவுக்கு தலைப்பு கொடுங்கள்...",
      memoryPlaceholder: "உங்கள் நினைவை இங்கே எழுதுங்கள்...",
      addPhoto: "📸 புகைப்படம் சேர்க்கவும்",
      removePhoto: "❌ புகைப்படத்தை அகற்றவும்",
      save: "நினைவை சேமிக்கவும் 💜",
      saving: "சேமிக்கப்படுகிறது...",

      myMemories: "என் நினைவுகள்",
      refresh: "🔄 புதுப்பிக்கவும்",
      waiting: "உங்கள் நினைவுத் தொகுப்பு காத்திருக்கிறது ✨",
      firstMemory: "மேலே உங்கள் முதல் சிறப்பு நினைவை சேமிக்கவும்.",

      edit: "✏️ திருத்து",
      delete: "🗑️ நீக்கு",
      editMemory: "✏️ நினைவை திருத்து",
      saveChanges: "💾 மாற்றங்களை சேமி",
      cancel: "ரத்து செய்",

      titleLabel: "தலைப்பு",
      memoryTypeLabel: "நினைவு வகை",
      memoryLabel: "நினைவு",
      voiceMemoryLabel: "குரல் நினைவு",

      aboutTitle: "🌟 Living Memory AI பற்றி",
      aboutText:
        "உங்கள் கதைகள், புகைப்படங்கள் மற்றும் குரல் நினைவுகளை AI மூலம் பாதுகாத்து அனுபவிக்கக்கூடிய தனிப்பட்ட டிஜிட்டல் இடம்.",

      memoryStorage: "நினைவு சேமிப்பு",
      memoryStorageDesc: "முக்கியமான தனிப்பட்ட நினைவுகளை சேமிக்கவும்.",

      voiceMemory: "குரல் நினைவு",
      voiceMemoryDesc: "தட்டச்சு செய்வதற்கு பதிலாக உங்கள் நினைவுகளை பேசுங்கள்.",

      photoMemory: "புகைப்பட நினைவுகள்",
      photoMemoryDesc: "முக்கியமான தருணங்களுடன் புகைப்படங்களை இணைக்கவும்.",

      aiConversation: "AI உரையாடல்",
      aiConversationDesc: "சேமித்த நினைவுகளைப் பற்றி கேள்விகள் கேளுங்கள்.",

      memoriesLive: "நினைவுகள் என்றும் வாழும்.",

      footerCopy: "© 2026 Living Memory AI — உங்கள் நினைவுகள், உங்கள் கதை.",

      personal: "தனிப்பட்ட",
      college: "கல்லூரி",
      family: "குடும்பம்",
      friends: "நண்பர்கள்",
      achievement: "சாதனை",
      project: "திட்டம்",
      food: "உணவு",
      travel: "பயணம்",
      other: "மற்றவை",

      email: "மின்னஞ்சல்",
      password: "கடவுச்சொல்",
      username: "பயனர்பெயர்",

      you: "நீங்கள்",

      quickQuestions: [
        "நான் தற்போது எந்த திட்டத்தில் வேலை செய்கிறேன்?",
        "எனது கல்லூரி பயணத்தைப் பற்றி சொல்லுங்கள்.",
        "நான் சேமித்துள்ள முக்கியமான விஷயங்கள் என்ன?",
      ],

      voiceRecorded: "🎤 குரல் பதிவு செய்யப்பட்டது. நினைவை சேமிக்கவும்.",

      voiceReady: "🎤 குரல் பதிவு சேமிக்க தயாராக உள்ளது.",
    },

    Malayalam: {
      home: "ഹോം",
      features: "സവിശേഷതകൾ",
      memories: "ഓർമ്മകൾ",
      about: "ഞങ്ങളെക്കുറിച്ച്",
      logout: "ലോഗ് ഔട്ട്",

      welcome: "വീണ്ടും സ്വാഗതം",
      startJourney: "നിങ്ങളുടെ ഓർമ്മ യാത്ര ആരംഭിക്കൂ",
      preserveStory: "നിങ്ങളുടെ കഥ സംരക്ഷിക്കൂ",
      welcomeText:
        "നിങ്ങളുടെ വിലപ്പെട്ട ഓർമ്മകൾ സുരക്ഷിതമായി സൂക്ഷിക്കുകയും എപ്പോൾ വേണമെങ്കിലും അവയുമായി സംസാരിക്കുകയും ചെയ്യൂ.",
      createAccount: "അക്കൗണ്ട് സൃഷ്ടിക്കുക",
      createText:
        "നിങ്ങളുടെ കഥകൾ, ഫോട്ടോകൾ, ശബ്ദ ഓർമ്മകൾ എന്നിവയ്ക്കായി ഒരു സ്വകാര്യ ഇടം സൃഷ്ടിക്കൂ.",

      login: "ലോഗിൻ →",
      creating: "സൃഷ്ടിക്കുന്നു...",
      loggingIn: "ലോഗിൻ ചെയ്യുന്നു...",
      signup: "അക്കൗണ്ട് ഇല്ലേ? സൈൻ അപ്പ് ചെയ്യൂ",
      alreadyAccount: "ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ? ലോഗിൻ ചെയ്യൂ",

      aiPowered: "AI മെമ്മറി കീപ്പർ",
      heroTitle: "നിങ്ങളുടെ ഓർമ്മകൾ. നിങ്ങളുടെ പൈതൃകം.",
      heroText:
        "Living Memory AI നിങ്ങളുടെ ഓർമ്മകളും കഥകളും ഫോട്ടോകളും ശബ്ദങ്ങളും സുരക്ഷിതമായി സൂക്ഷിക്കാൻ സഹായിക്കുന്നു.",

      getStarted: "തുടങ്ങാം →",
      learnMore: "▶ കൂടുതൽ അറിയുക",

      preserveMoments: "പ്രധാനപ്പെട്ട നിമിഷങ്ങൾ സംരക്ഷിക്കൂ",
      thatMatter: "അവ എന്നും നിങ്ങളുടെ ഓർമ്മയിൽ നിലനിൽക്കട്ടെ.",

      aiMemoryChat: "AI ഓർമ്മ ചാറ്റ്",
      askPast: "നിങ്ങളുടെ ഭൂതകാലത്തെക്കുറിച്ച് ചോദിക്കൂ.",

      voiceMemoryCard: "വോയ്സ് ഓർമ്മ",
      recordMoments: "വിലപ്പെട്ട നിമിഷങ്ങൾ റെക്കോർഡ് ചെയ്യൂ.",

      photoMemoryCard: "ഫോട്ടോ ഓർമ്മ",
      keepVisual: "ഓർമ്മകൾ ചിത്രങ്ങളായി സൂക്ഷിക്കൂ.",

      privateMemories: "സ്വകാര്യ ഓർമ്മകൾ",
      secureAlways: "സുരക്ഷിതം. സ്വകാര്യം. എപ്പോഴും നിങ്ങളുടേത്.",

      featuresTitle: "നിങ്ങളുടെ ഓർമ്മകൾക്ക് വേണ്ടതെല്ലാം",

      textMemories: "ടെക്സ്റ്റ് ഓർമ്മകൾ",
      textMemoriesDesc:
        "നിങ്ങളുടെ ചിന്തകളും കഥകളും പ്രത്യേക നിമിഷങ്ങളും എഴുതൂ.",

      photoMemories: "ഫോട്ടോ ഓർമ്മകൾ",
      photoMemoriesDesc:
        "നിങ്ങളുടെ ഓർമ്മകളോടൊപ്പം ഫോട്ടോകൾ സുരക്ഷിതമായി സൂക്ഷിക്കൂ.",

      voiceMemories: "വോയ്സ് ഓർമ്മകൾ",
      voiceMemoriesDesc:
        "നിങ്ങളുടെ വിലപ്പെട്ട വാക്കുകളും സംഭാഷണങ്ങളും റെക്കോർഡ് ചെയ്യൂ.",

      aiChat: "AI ചാറ്റ്",
      aiChatDesc: "AI ഉപയോഗിച്ച് നിങ്ങളുടെ ഓർമ്മകളുമായി സംസാരിക്കൂ.",

      smartSearch: "സ്മാർട്ട് തിരയൽ",
      smartSearchDesc:
        "കീവേഡുകൾ ഉപയോഗിച്ച് നിങ്ങളുടെ ഓർമ്മകൾ വേഗത്തിൽ കണ്ടെത്തൂ.",

      secure: "സുരക്ഷിതവും സ്വകാര്യവും",
      secureDesc:
        "നിങ്ങളുടെ ഓർമ്മകൾ നിങ്ങളുടെ സ്വകാര്യ അക്കൗണ്ടിൽ സുരക്ഷിതമായിരിക്കും.",

      memoriesSaved: "സംരക്ഷിച്ച ഓർമ്മകൾ",
      memoryFormats: "ഓർമ്മ ഫോർമാറ്റുകൾ",
      memoryAssistant: "ഓർമ്മ സഹായി",
      storyAvailable: "നിങ്ങളുടെ കഥ ലഭ്യമാണ്",

      talkMemories: "നിങ്ങളുടെ ഓർമ്മകളോട് സംസാരിക്കൂ",
      aiResponses: "AI മറുപടികൾ:",
      askPlaceholder: "നിങ്ങളുടെ ഓർമ്മകളെക്കുറിച്ച് എന്തെങ്കിലും ചോദിക്കൂ...",
      askAI: "Living Memory AI-യോട് ചോദിക്കൂ",
      thinking: "ചിന്തിക്കുന്നു...",
      askAnything: "നിങ്ങൾ സംരക്ഷിച്ച ഓർമ്മകളെക്കുറിച്ച് എന്തും ചോദിക്കൂ.",

      findMemory: "ഒരു ഓർമ്മ കണ്ടെത്തൂ",
      searchPlaceholder: "നിങ്ങളുടെ ഓർമ്മകൾ തിരയൂ...",
      noResults: "പൊരുത്തപ്പെടുന്ന ഓർമ്മകളൊന്നും കണ്ടെത്തിയില്ല.",
      searchResultsFor: "ഫലങ്ങൾ",

      saveMemory: "പുതിയ ഓർമ്മ സംരക്ഷിക്കൂ",
      titlePlaceholder: "നിങ്ങളുടെ ഓർമ്മയ്ക്ക് ഒരു തലക്കെട്ട് നൽകൂ...",
      memoryPlaceholder: "നിങ്ങളുടെ ഓർമ്മ ഇവിടെ എഴുതൂ...",
      addPhoto: "📸 ഫോട്ടോ ചേർക്കൂ",
      removePhoto: "❌ ഫോട്ടോ നീക്കം ചെയ്യൂ",
      save: "ഓർമ്മ സംരക്ഷിക്കൂ 💜",
      saving: "സംരക്ഷിക്കുന്നു...",

      myMemories: "എന്റെ ഓർമ്മകൾ",
      refresh: "🔄 പുതുക്കുക",
      waiting: "നിങ്ങളുടെ ഓർമ്മ ശേഖരം കാത്തിരിക്കുന്നു ✨",
      firstMemory: "മുകളിൽ നിങ്ങളുടെ ആദ്യത്തെ പ്രത്യേക ഓർമ്മ സംരക്ഷിക്കൂ.",

      edit: "✏️ തിരുത്തുക",
      delete: "🗑️ ഇല്ലാതാക്കുക",
      editMemory: "✏️ ഓർമ്മ തിരുത്തുക",
      saveChanges: "💾 മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
      cancel: "റദ്ദാക്കുക",

      titleLabel: "തലക്കെട്ട്",
      memoryTypeLabel: "ഓർമ്മയുടെ തരം",
      memoryLabel: "ഓർമ്മ",
      voiceMemoryLabel: "വോയ്സ് ഓർമ്മ",

      aboutTitle: "🌟 Living Memory AI-യെ കുറിച്ച്",
      aboutText:
        "നിങ്ങളുടെ കഥകളും ഫോട്ടോകളും ശബ്ദ ഓർമ്മകളും AI ഉപയോഗിച്ച് സംരക്ഷിക്കാനും അനുഭവിക്കാനും കഴിയുന്ന വ്യക്തിഗത ഡിജിറ്റൽ ഇടം.",

      memoryStorage: "മെമ്മറി സ്റ്റോറേജ്",
      memoryStorageDesc: "പ്രധാനപ്പെട്ട വ്യക്തിഗത ഓർമ്മകൾ സംരക്ഷിക്കൂ.",

      voiceMemory: "വോയ്സ് മെമ്മറി",
      voiceMemoryDesc:
        "ടൈപ്പ് ചെയ്യുന്നതിന് പകരം നിങ്ങളുടെ ഓർമ്മകൾ സംസാരിക്കൂ.",

      photoMemory: "ഫോട്ടോ ഓർമ്മകൾ",
      photoMemoryDesc: "പ്രധാനപ്പെട്ട നിമിഷങ്ങളിലേക്ക് ഫോട്ടോകൾ ചേർക്കൂ.",

      aiConversation: "AI സംഭാഷണം",
      aiConversationDesc:
        "നിങ്ങൾ സംരക്ഷിച്ച ഓർമ്മകളെക്കുറിച്ച് ചോദ്യങ്ങൾ ചോദിക്കൂ.",

      memoriesLive: "ഓർമ്മകൾ എന്നും ജീവിക്കും.",

      footerCopy: "© 2026 Living Memory AI — നിങ്ങളുടെ ഓർമ്മകൾ, നിങ്ങളുടെ കഥ.",

      personal: "വ്യക്തിഗതം",
      college: "കോളേജ്",
      family: "കുടുംബം",
      friends: "സുഹൃത്തുക്കൾ",
      achievement: "നേട്ടം",
      project: "പ്രോജക്റ്റ്",
      food: "ഭക്ഷണം",
      travel: "യാത്ര",
      other: "മറ്റുള്ളവ",

      email: "ഇമെയിൽ",
      password: "പാസ്‌വേഡ്",
      username: "ഉപയോക്തൃനാമം",

      you: "നിങ്ങൾ",

      quickQuestions: [
        "ഞാൻ ഇപ്പോൾ ഏത് പ്രോജക്റ്റിലാണ് പ്രവർത്തിക്കുന്നത്?",
        "എന്റെ കോളേജ് യാത്രയെക്കുറിച്ച് പറയൂ.",
        "ഞാൻ സംരക്ഷിച്ച പ്രധാനപ്പെട്ട കാര്യങ്ങൾ എന്തൊക്കെയാണ്?",
      ],

      voiceRecorded: "🎤 ശബ്ദം റെക്കോർഡ് ചെയ്തു. ഓർമ്മ സംരക്ഷിക്കൂ.",

      voiceReady: "🎤 വോയ്സ് റെക്കോർഡിംഗ് സംരക്ഷിക്കാൻ തയ്യാറാണ്.",
    },
  };

  const ui = translations[language] || translations.English;
  const profileTranslations = {
    English: {
      label: "👥 RELATIONSHIP PROFILES",
      title: "People Behind Your Memories",
      description: "Organize memories around the people who matter most.",
      mother: "Mother",
      motherDescription:
        "Family memories, stories, advice and special moments.",
      father: "Father",
      fatherDescription:
        "Important experiences, conversations and family memories.",
      viewMemories: "View Memories →",
      generateSummary: "🧠 Generate AI Summary",
      generateLifeStory: "📖 Generate AI Life Story",
    },
    Kannada: {
      label: "👥 ಸಂಬಂಧಗಳ ಪ್ರೊಫೈಲ್‌ಗಳು",
      title: "ನಿಮ್ಮ ನೆನಪುಗಳ ಹಿಂದಿರುವ ಜನರು",
      description: "ನಿಮಗೆ ಮುಖ್ಯವಾದ ಜನರ ಸುತ್ತ ನಿಮ್ಮ ನೆನಪುಗಳನ್ನು ಆಯೋಜಿಸಿ.",
      mother: "ತಾಯಿ",
      motherDescription:
        "ಕುಟುಂಬದ ನೆನಪುಗಳು, ಕಥೆಗಳು, ಸಲಹೆಗಳು ಮತ್ತು ವಿಶೇಷ ಕ್ಷಣಗಳು.",
      father: "ತಂದೆ",
      fatherDescription: "ಪ್ರಮುಖ ಅನುಭವಗಳು, ಸಂಭಾಷಣೆಗಳು ಮತ್ತು ಕುಟುಂಬದ ನೆನಪುಗಳು.",
      viewMemories: "ನೆನಪುಗಳನ್ನು ನೋಡಿ →",
      generateSummary: "🧠 AI ಸಾರಾಂಶ ರಚಿಸಿ",
      generateLifeStory: "📖 AI ಜೀವನ ಕಥೆ ರಚಿಸಿ",
    },
    Hindi: {
      label: "👥 रिश्तों की प्रोफ़ाइल",
      title: "आपकी यादों के पीछे के लोग",
      description: "अपने महत्वपूर्ण लोगों से जुड़ी यादों को व्यवस्थित करें।",
      mother: "माँ",
      motherDescription: "परिवार की यादें, कहानियाँ, सलाह और खास पल।",
      father: "पिता",
      fatherDescription: "महत्वपूर्ण अनुभव, बातचीत और पारिवारिक यादें।",
      viewMemories: "यादें देखें →",
      generateSummary: "🧠 AI सारांश बनाएं",
      generateLifeStory: "📖 AI जीवन कहानी बनाएं",
    },
    Tamil: {
      label: "👥 உறவினர் சுயவிவரங்கள்",
      title: "உங்கள் நினைவுகளுக்குப் பின்னால் உள்ளவர்கள்",
      description:
        "உங்களுக்கு முக்கியமானவர்களுடன் தொடர்புடைய நினைவுகளை ஒழுங்குபடுத்துங்கள்.",
      mother: "அம்மா",
      motherDescription:
        "குடும்ப நினைவுகள், கதைகள், ஆலோசனைகள் மற்றும் சிறப்பான தருணங்கள்.",
      father: "அப்பா",
      fatherDescription:
        "முக்கிய அனுபவங்கள், உரையாடல்கள் மற்றும் குடும்ப நினைவுகள்.",
      viewMemories: "நினைவுகளைக் காண்க →",
      generateSummary: "🧠 AI சுருக்கத்தை உருவாக்கு",
      generateLifeStory: "📖 AI வாழ்க்கைக் கதையை உருவாக்கு",
    },
    Malayalam: {
      label: "👥 ബന്ധങ്ങളുടെ പ്രൊഫൈലുകൾ",
      title: "നിങ്ങളുടെ ഓർമ്മകൾക്ക് പിന്നിലെ ആളുകൾ",
      description:
        "നിങ്ങൾക്ക് പ്രധാനപ്പെട്ട ആളുകളുമായി ബന്ധപ്പെട്ട ഓർമ്മകൾ ക്രമീകരിക്കൂ.",
      mother: "അമ്മ",
      motherDescription: "കുടുംബ ഓർമ്മകൾ, കഥകൾ, ഉപദേശങ്ങൾ, പ്രത്യേക നിമിഷങ്ങൾ.",
      father: "അച്ഛൻ",
      fatherDescription: "പ്രധാന അനുഭവങ്ങൾ, സംഭാഷണങ്ങൾ, കുടുംബ ഓർമ്മകൾ.",
      viewMemories: "ഓർമ്മകൾ കാണുക →",
      generateSummary: "🧠 AI സംഗ്രഹം സൃഷ്ടിക്കുക",
      generateLifeStory: "📖 AI ജീവിതകഥ സൃഷ്ടിക്കുക",
    },
  };

  const profileUi =
    profileTranslations[language] || profileTranslations.English;

  const profileMoreTranslations = {
    English: {
      mom: "Mom",
      dad: "Dad",
      defaultDescription: "Personal memories and important moments.",
      addProfile: "Add Profile",
      addProfileDescription:
        "Create a profile for someone important in your life.",
      createProfile: "+ Create Profile",
      createRelationshipProfile: "Create Relationship Profile",
      name: "Name",
      relationship: "Relationship",
      description: "Description",
      creating: "Creating...",
      cancel: "Cancel",
      generatingSummary: "Generating summary...",
      writingLifeStory: "Writing life story...",
      livingIdentity: "✨ Living Identity",
      lifeStoryTitle: "📖 {name}'s Life Story",
      copyLifeStory: "📋 Copy Life Story",
      copySuccess: "Life story copied successfully! 💗",
      copyFail:
        "Copy failed. Please select the story text and copy it manually.",
    },
    Kannada: {
      mom: "ಅಮ್ಮ",
      dad: "ಅಪ್ಪ",
      defaultDescription: "ವೈಯಕ್ತಿಕ ನೆನಪುಗಳು ಮತ್ತು ಪ್ರಮುಖ ಕ್ಷಣಗಳು.",
      addProfile: "ಪ್ರೊಫೈಲ್ ಸೇರಿಸಿ",
      addProfileDescription:
        "ನಿಮ್ಮ ಜೀವನದಲ್ಲಿ ಮುಖ್ಯವಾದ ವ್ಯಕ್ತಿಗಾಗಿ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ.",
      createProfile: "+ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ",
      createRelationshipProfile: "ಸಂಬಂಧದ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ",
      name: "ಹೆಸರು",
      relationship: "ಸಂಬಂಧ",
      description: "ವಿವರಣೆ",
      creating: "ರಚಿಸಲಾಗುತ್ತಿದೆ...",
      cancel: "ರದ್ದುಮಾಡಿ",
      generatingSummary: "ಸಾರಾಂಶ ರಚಿಸಲಾಗುತ್ತಿದೆ...",
      writingLifeStory: "ಜೀವನ ಕಥೆ ಬರೆಯಲಾಗುತ್ತಿದೆ...",
      livingIdentity: "✨ ಜೀವನದ ಪರಿಚಯ",
      lifeStoryTitle: "📖 {name} ಅವರ ಜೀವನ ಕಥೆ",
      copyLifeStory: "📋 ಜೀವನ ಕಥೆಯನ್ನು ನಕಲಿಸಿ",
      copySuccess: "ಜೀವನ ಕಥೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನಕಲಿಸಲಾಗಿದೆ! 💗",
      copyFail:
        "ನಕಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಕಥೆಯ ಪಠ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಕೈಯಾರೆ ನಕಲಿಸಿ.",
    },
    Hindi: {
      mom: "माँ",
      dad: "पापा",
      defaultDescription: "व्यक्तिगत यादें और महत्वपूर्ण पल।",
      addProfile: "प्रोफ़ाइल जोड़ें",
      addProfileDescription:
        "अपने जीवन के किसी महत्वपूर्ण व्यक्ति के लिए प्रोफ़ाइल बनाएं।",
      createProfile: "+ प्रोफ़ाइल बनाएं",
      createRelationshipProfile: "रिश्ते की प्रोफ़ाइल बनाएं",
      name: "नाम",
      relationship: "रिश्ता",
      description: "विवरण",
      creating: "बनाया जा रहा है...",
      cancel: "रद्द करें",
      generatingSummary: "सारांश बनाया जा रहा है...",
      writingLifeStory: "जीवन कहानी लिखी जा रही है...",
      livingIdentity: "✨ जीवंत पहचान",
      lifeStoryTitle: "📖 {name} की जीवन कहानी",
      copyLifeStory: "📋 जीवन कहानी कॉपी करें",
      copySuccess: "जीवन कहानी सफलतापूर्वक कॉपी हो गई! 💗",
      copyFail:
        "कॉपी नहीं हो सकी। कहानी का टेक्स्ट चुनकर मैन्युअल रूप से कॉपी करें।",
    },
    Tamil: {
      mom: "அம்மா",
      dad: "அப்பா",
      defaultDescription: "தனிப்பட்ட நினைவுகளும் முக்கியமான தருணங்களும்.",
      addProfile: "சுயவிவரத்தைச் சேர்க்கவும்",
      addProfileDescription:
        "உங்கள் வாழ்க்கையில் முக்கியமான ஒருவருக்கான சுயவிவரத்தை உருவாக்கவும்.",
      createProfile: "+ சுயவிவரத்தை உருவாக்கவும்",
      createRelationshipProfile: "உறவு சுயவிவரத்தை உருவாக்கவும்",
      name: "பெயர்",
      relationship: "உறவு",
      description: "விளக்கம்",
      creating: "உருவாக்கப்படுகிறது...",
      cancel: "ரத்து செய்",
      generatingSummary: "சுருக்கம் உருவாக்கப்படுகிறது...",
      writingLifeStory: "வாழ்க்கைக் கதை எழுதப்படுகிறது...",
      livingIdentity: "✨ வாழ்வின் அடையாளம்",
      lifeStoryTitle: "📖 {name} அவர்களின் வாழ்க்கைக் கதை",
      copyLifeStory: "📋 வாழ்க்கைக் கதையை நகலெடு",
      copySuccess: "வாழ்க்கைக் கதை வெற்றிகரமாக நகலெடுக்கப்பட்டது! 💗",
      copyFail:
        "நகலெடுக்க முடியவில்லை. கதையின் உரையைத் தேர்ந்தெடுத்து கைமுறையாக நகலெடுக்கவும்.",
    },
    Malayalam: {
      mom: "അമ്മ",
      dad: "അച്ഛൻ",
      defaultDescription: "വ്യക്തിപരമായ ഓർമ്മകളും പ്രധാനപ്പെട്ട നിമിഷങ്ങളും.",
      addProfile: "പ്രൊഫൈൽ ചേർക്കുക",
      addProfileDescription:
        "നിങ്ങളുടെ ജീവിതത്തിലെ പ്രധാനപ്പെട്ട ഒരാൾക്കായി പ്രൊഫൈൽ സൃഷ്ടിക്കുക.",
      createProfile: "+ പ്രൊഫൈൽ സൃഷ്ടിക്കുക",
      createRelationshipProfile: "ബന്ധത്തിന്റെ പ്രൊഫൈൽ സൃഷ്ടിക്കുക",
      name: "പേര്",
      relationship: "ബന്ധം",
      description: "വിവരണം",
      creating: "സൃഷ്ടിക്കുന്നു...",
      cancel: "റദ്ദാക്കുക",
      generatingSummary: "സംഗ്രഹം സൃഷ്ടിക്കുന്നു...",
      writingLifeStory: "ജീവിതകഥ എഴുതുന്നു...",
      livingIdentity: "✨ ജീവിതപരിചയം",
      lifeStoryTitle: "📖 {name}-ന്റെ ജീവിതകഥ",
      copyLifeStory: "📋 ജീവിതകഥ പകർത്തുക",
      copySuccess: "ജീവിതകഥ വിജയകരമായി പകർത്തി! 💗",
      copyFail: "പകർത്താനായില്ല. കഥയിലെ വാചകം തിരഞ്ഞെടുത്ത് സ്വമേധയാ പകർത്തുക.",
    },
  };
  const profileMoreUi =
    profileMoreTranslations[language] || profileMoreTranslations.English;

  const timelineTranslations = {
    English: {
      personalTitle: "🕰️ Personal Memory Timeline",
      unassignedTitle: "🕰️ Unassigned Memory Timeline",
      personTitleSuffix: "'s Memory Timeline",
      description:
        "Choose a person to explore only the memories linked to them.",
      showFor: "Show timeline for:",
      allProfiles: "All profiles",
      unassignedMemories: "Unassigned memories",
      noLinkedMemories: "No memories are linked to this selection yet.",
      noMemories: "No memories available yet.",
      dateUnavailable: "Date unavailable",
      unassignedMemory: "Unassigned memory",
    },
    Kannada: {
      personalTitle: "🕰️ ವೈಯಕ್ತಿಕ ನೆನಪುಗಳ ಕಾಲರೇಖೆ",
      unassignedTitle: "🕰️ ನಿಯೋಜಿಸದ ನೆನಪುಗಳ ಕಾಲರೇಖೆ",
      personTitleSuffix: " ಅವರ ನೆನಪುಗಳ ಕಾಲರೇಖೆ",
      description:
        "ಆ ವ್ಯಕ್ತಿಗೆ ಸಂಬಂಧಿಸಿದ ನೆನಪುಗಳನ್ನು ಮಾತ್ರ ನೋಡಲು ಒಬ್ಬರನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
      showFor: "ಯಾರ ಕಾಲರೇಖೆಯನ್ನು ತೋರಿಸಬೇಕು:",
      allProfiles: "ಎಲ್ಲಾ ಪ್ರೊಫೈಲ್‌ಗಳು",
      unassignedMemories: "ನಿಯೋಜಿಸದ ನೆನಪುಗಳು",
      noLinkedMemories: "ಈ ಆಯ್ಕೆಗೆ ಇನ್ನೂ ಯಾವುದೇ ನೆನಪುಗಳನ್ನು ಲಿಂಕ್ ಮಾಡಿಲ್ಲ.",
      noMemories: "ಇನ್ನೂ ಯಾವುದೇ ನೆನಪುಗಳು ಲಭ್ಯವಿಲ್ಲ.",
      dateUnavailable: "ದಿನಾಂಕ ಲಭ್ಯವಿಲ್ಲ",
      unassignedMemory: "ನಿಯೋಜಿಸದ ನೆನಪು",
    },
    Hindi: {
      personalTitle: "🕰️ व्यक्तिगत यादों की समयरेखा",
      unassignedTitle: "🕰️ बिना प्रोफ़ाइल वाली यादों की समयरेखा",
      personTitleSuffix: " की यादों की समयरेखा",
      description: "किसी व्यक्ति से जुड़ी यादें देखने के लिए उसे चुनें।",
      showFor: "किसकी समयरेखा दिखाएं:",
      allProfiles: "सभी प्रोफ़ाइल",
      unassignedMemories: "बिना प्रोफ़ाइल वाली यादें",
      noLinkedMemories: "इस चयन से अभी कोई याद जुड़ी नहीं है।",
      noMemories: "अभी कोई याद उपलब्ध नहीं है।",
      dateUnavailable: "तारीख उपलब्ध नहीं है",
      unassignedMemory: "बिना प्रोफ़ाइल की याद",
    },
    Tamil: {
      personalTitle: "🕰️ தனிப்பட்ட நினைவுகளின் காலவரிசை",
      unassignedTitle: "🕰️ ஒதுக்கப்படாத நினைவுகளின் காலவரிசை",
      personTitleSuffix: " அவர்களின் நினைவுகளின் காலவரிசை",
      description:
        "ஒருவருடன் இணைக்கப்பட்ட நினைவுகளை மட்டும் காண அவரைத் தேர்ந்தெடுக்கவும்.",
      showFor: "காலவரிசையைக் காண்பிக்க:",
      allProfiles: "அனைத்து சுயவிவரங்களும்",
      unassignedMemories: "ஒதுக்கப்படாத நினைவுகள்",
      noLinkedMemories: "இந்தத் தேர்வுடன் இன்னும் நினைவுகள் இணைக்கப்படவில்லை.",
      noMemories: "இன்னும் நினைவுகள் எதுவும் இல்லை.",
      dateUnavailable: "தேதி கிடைக்கவில்லை",
      unassignedMemory: "ஒதுக்கப்படாத நினைவு",
    },
    Malayalam: {
      personalTitle: "🕰️ വ്യക്തിഗത ഓർമ്മകളുടെ കാലരേഖ",
      unassignedTitle: "🕰️ നിയോഗിക്കാത്ത ഓർമ്മകളുടെ കാലരേഖ",
      personTitleSuffix: "-ന്റെ ഓർമ്മകളുടെ കാലരേഖ",
      description:
        "ഒരു വ്യക്തിയുമായി ബന്ധിപ്പിച്ച ഓർമ്മകൾ മാത്രം കാണാൻ ആ വ്യക്തിയെ തിരഞ്ഞെടുക്കുക.",
      showFor: "കാലരേഖ കാണിക്കേണ്ടത്:",
      allProfiles: "എല്ലാ പ്രൊഫൈലുകളും",
      unassignedMemories: "നിയോഗിക്കാത്ത ഓർമ്മകൾ",
      noLinkedMemories:
        "ഈ തിരഞ്ഞെടുപ്പുമായി ഓർമ്മകളൊന്നും ഇതുവരെ ബന്ധിപ്പിച്ചിട്ടില്ല.",
      noMemories: "ഇതുവരെ ഓർമ്മകളൊന്നും ലഭ്യമല്ല.",
      dateUnavailable: "തീയതി ലഭ്യമല്ല",
      unassignedMemory: "നിയോഗിക്കാത്ത ഓർമ്മ",
    },
  };
  const timelineUi =
    timelineTranslations[language] || timelineTranslations.English;
  const languageLocales = {
    English: "en-US",
    Kannada: "kn-IN",
    Hindi: "hi-IN",
    Tamil: "ta-IN",
    Malayalam: "ml-IN",
  };
  const visibleMemories = memories.filter((memory) => {
    const matchesProfile =
      activeProfileFilter === null ||
      (activeProfileFilter === "unassigned"
        ? memory.profile_id == null
        : Number(memory.profile_id) === Number(activeProfileFilter));

    const matchesType =
      !memoryTypeFilter || memory.memory_type === memoryTypeFilter;

    const memoryDate = memory.created_at
      ? (() => {
          const date = new Date(memory.created_at);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        })()
      : "";

    const matchesFromDate =
      !dateFromFilter || (memoryDate !== "" && memoryDate >= dateFromFilter);

    const matchesToDate =
      !dateToFilter || (memoryDate !== "" && memoryDate <= dateToFilter);

    return matchesProfile && matchesType && matchesFromDate && matchesToDate;
  });

  const selectedTimelineProfile = profiles.find(
    (profile) => String(profile.id) === String(timelineProfileId),
  );

  const timelineMemories = [...memories]
    .filter((memory) => {
      if (timelineProfileId === "unassigned") {
        return memory.profile_id == null;
      }
      if (!timelineProfileId) {
        return true;
      }
      return String(memory.profile_id) === String(timelineProfileId);
    })
    .sort(
      (a, b) =>
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime(),
    );
  // =====================================================
  // IMAGE
  // =====================================================

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMemoryMessage("Please select a JPG, PNG, WEBP or GIF image.");
      return;
    }

    setSelectedImage(file);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(URL.createObjectURL(file));

    setMemoryMessage("");
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");
  };

  const uploadMemoryImage = async (memoryId) => {
    if (!selectedImage) return true;

    setUploadingImage(true);

    try {
      const formData = new FormData();

      formData.append("image", selectedImage);

      const response = await fetch(`${API}/memories/${memoryId}/image`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not upload image.");
      }

      return true;
    } catch (error) {
      console.error("Image upload error:", error);

      setMemoryMessage(error.message || "Could not upload image.");

      return false;
    } finally {
      setUploadingImage(false);
    }
  };

  // =====================================================
  // AUDIO
  // =====================================================

  const uploadMemoryAudio = async (memoryId) => {
    if (!selectedAudio) return true;

    setUploadingAudio(true);

    try {
      const formData = new FormData();

      formData.append("audio", selectedAudio, "memory.webm");

      const response = await fetch(`${API}/memories/${memoryId}/audio`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not upload audio.");
      }

      return true;
    } catch (error) {
      console.error("Audio upload error:", error);

      setMemoryMessage(error.message || "Could not upload audio.");

      return false;
    } finally {
      setUploadingAudio(false);
    }
  };

  // =====================================================
  // SIGNUP
  // =====================================================

  const handleSignup = async (event) => {
    event.preventDefault();

    setAuthMessage("");

    if (!authUsername.trim()) {
      setAuthMessage("Please enter your username.");
      return;
    }

    if (!authEmail.trim()) {
      setAuthMessage("Please enter your email.");
      return;
    }

    if (!authPassword.trim()) {
      setAuthMessage("Please enter your password.");
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch(`${API}/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: authUsername.trim(),
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed.");
      }

      setAuthMessage("Account created successfully! Please login. 🎉");

      setShowSignup(false);
      setAuthPassword("");
    } catch (error) {
      console.error("Signup error:", error);

      setAuthMessage(error.message || "Could not connect to backend.");
    } finally {
      setAuthLoading(false);
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    setAuthMessage("");
    setAuthLoading(true);

    try {
      const response = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid email or password.");
      }

      const id = Number(data.user_id);

      localStorage.setItem("loggedIn", "true");

      localStorage.setItem("user_id", String(id));

      localStorage.setItem("email", data.email || authEmail);

      localStorage.setItem("username", data.username || authUsername);

      setUserId(id);

      setAuthEmail(data.email || authEmail);

      setAuthUsername(data.username || authUsername);

      setLoggedIn(true);
      setAuthPassword("");
      setAuthMessage("Login successful! 🎉");
    } catch (error) {
      console.error("Login error:", error);

      setAuthMessage(error.message || "Could not connect to backend.");
    } finally {
      setAuthLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");

    localStorage.removeItem("user_id");

    localStorage.removeItem("email");

    localStorage.removeItem("username");

    setLoggedIn(false);
    setUserId(null);
    setMemories([]);
    setSearchResults([]);
    setMessages([]);
    setAuthPassword("");
    setAuthMessage("");

    clearSelectedImage();
    setSelectedAudio(null);

    setProfiles([]);
    setShowProfileForm(false);
    setProfileName("");
    setProfileRelationship("");
    setProfileDescription("");
    setProfileMessage("");
  };

  // =====================================================
  // LOAD MEMORIES
  // =====================================================

  const loadMemories = useCallback(async () => {
    const id = Number(localStorage.getItem("user_id"));

    if (!id) {
      setMemories([]);
      return;
    }

    try {
      const response = await fetch(`${API}/memories/?user_id=${id}`);

      if (!response.ok) {
        throw new Error("Could not load memories.");
      }

      const data = await response.json();

      setMemories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Could not load memories:", error);

      setMemories([]);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn || !userId) return;

    let cancelled = false;

    const fetchMemories = async () => {
      try {
        const id = Number(localStorage.getItem("user_id"));

        if (!id || cancelled) return;

        const response = await fetch(`${API}/memories/?user_id=${id}`);

        if (!response.ok) {
          throw new Error("Could not load memories.");
        }

        const data = await response.json();

        if (!cancelled) {
          setMemories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Could not load memories:", error);

        if (!cancelled) {
          setMemories([]);
        }
      }
    };

    fetchMemories();

    return () => {
      cancelled = true;
    };
  }, [loggedIn, userId]);
  // =====================================================
  // SAVE MEMORY
  // =====================================================

  const handleSaveMemory = async (event) => {
    event.preventDefault();

    setMemoryMessage("");

    if (!title.trim()) {
      setMemoryMessage("Please enter a memory title.");
      return;
    }

    if (!content.trim()) {
      setMemoryMessage("Please enter your memory.");
      return;
    }

    if (!userId) {
      setMemoryMessage("Please login first.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API}/memories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          memory_type: memoryType,
          user_id: userId,
          profile_id: selectedProfileId ? Number(selectedProfileId) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not save memory.");
      }

      const memoryId = data.id;

      let imageUploaded = true;
      let audioUploaded = true;

      if (selectedImage) {
        imageUploaded = await uploadMemoryImage(memoryId);
      }

      if (selectedAudio) {
        audioUploaded = await uploadMemoryAudio(memoryId);
      }

      setTitle("");
      setContent("");
      setMemoryType("personal");

      clearSelectedImage();
      setSelectedAudio(null);

      await loadMemories();

      if (imageUploaded && audioUploaded && selectedImage && selectedAudio) {
        setMemoryMessage("Memory, photo and voice saved successfully! 📸🎤");
      } else if (imageUploaded && audioUploaded && selectedImage) {
        setMemoryMessage("Memory and photo saved successfully! 📸");
      } else if (imageUploaded && audioUploaded && selectedAudio) {
        setMemoryMessage("Memory and voice saved successfully! 🎤");
      } else if (!imageUploaded) {
        setMemoryMessage("Memory saved, but image upload failed.");
      } else if (!audioUploaded) {
        setMemoryMessage("Memory saved, but voice upload failed.");
      } else {
        setMemoryMessage("Memory saved successfully! 💜");
      }
    } catch (error) {
      console.error("Save memory error:", error);

      setMemoryMessage(error.message || "Could not save memory.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const searchMemories = useCallback(async () => {
    if (!userId) {
      setSearchResults([]);
      return;
    }

    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${API}/memories/search?q=${encodeURIComponent(
          search.trim(),
        )}&user_id=${userId}`,
      );

      if (!response.ok) {
        throw new Error("Search failed.");
      }

      const data = await response.json();

      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search error:", error);

      setSearchResults([]);
    }
  }, [search, userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMemories();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchMemories]);

  // =====================================================
  // EDIT MEMORY
  // =====================================================

  const startEditingMemory = (memory) => {
    setEditingMemoryId(memory.id);

    setEditTitle(memory.title || "");

    setEditContent(memory.content || "");

    setEditMemoryType(memory.memory_type || "personal");
    setEditProfileId(
      memory.profile_id != null ? String(memory.profile_id) : "",
    );

    setMemoryMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEditingMemory = () => {
    setEditingMemoryId(null);
    setEditTitle("");
    setEditContent("");
    setEditMemoryType("personal");
    setEditProfileId("");
    setMemoryMessage("");
  };

  const handleUpdateMemory = async (event) => {
    event.preventDefault();

    if (!editingMemoryId) return;

    if (!editTitle.trim()) {
      setMemoryMessage("Please enter a memory title.");
      return;
    }

    if (!editContent.trim()) {
      setMemoryMessage("Please enter the memory content.");
      return;
    }

    if (!userId) {
      setMemoryMessage("Please login first.");
      return;
    }

    setEditLoading(true);
    setMemoryMessage("");

    try {
      const response = await fetch(`${API}/memories/${editingMemoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          memory_type: editMemoryType,
          user_id: userId,
          profile_id: editProfileId ? Number(editProfileId) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update memory.");
      }

      setMemoryMessage("Memory updated successfully! ✨");

      cancelEditingMemory();
      await loadMemories();
    } catch (error) {
      console.error("Update memory error:", error);

      setMemoryMessage(error.message || "Could not update memory.");
    } finally {
      setEditLoading(false);
    }
  };

  // =====================================================
  // DELETE MEMORY
  // =====================================================

  const handleDeleteMemory = async (memoryId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this memory?",
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API}/memories/${memoryId}?user_id=${userId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not delete memory.");
      }

      await loadMemories();
    } catch (error) {
      console.error("Delete memory error:", error);

      setMemoryMessage(error.message || "Could not delete memory.");
    }
  };

  // =====================================================
  // AI
  // =====================================================

  const askAI = async (text = question) => {
    const prompt = text.trim();

    if (!prompt || !userId) return;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: prompt,
      },
    ]);

    setQuestion("");
    setLoadingAI(true);

    try {
      const response = await fetch(`${API}/memories/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          question: prompt,
          profile_id: chatProfileId ? Number(chatProfileId) : null,
          language: language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "AI request failed.");
      }

      const answer =
        data.answer ||
        data.response ||
        data.message ||
        "I couldn't find an answer.";

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      console.error("AI error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I couldn't connect to the AI service. Please make sure Ollama is running.",
        },
      ]);
    } finally {
      setLoadingAI(false);
    }
  };

  // =====================================================
  // AI VOICE REPLY — LOCAL KANNADA TTS
  // =====================================================

  const speakAIResponse = async (text) => {
    if (["Kannada", "Hindi", "Tamil", "Malayalam"].includes(language)) {
      try {
        const response = await fetch("http://127.0.0.1:8002/tts/speak", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            language,
          }),
        });

        if (!response.ok) {
          throw new Error("Local Kannada voice generation failed.");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
        return;
      } catch (error) {
        console.error("Kannada voice error:", error);

        alert(
          "Could not generate Kannada voice. " +
            "Please check that your local TTS server is running on port 8002.",
        );
        return;
      }
    }

    // For other languages, use an available offline browser voice.
    const synth = window.speechSynthesis;

    if (!synth) {
      alert("Voice is not supported in this browser.");
      return;
    }

    const languageCodes = {
      English: "en-IN",
      Hindi: "hi-IN",
      Tamil: "ta-IN",
      Malayalam: "ml-IN",
    };

    const target = languageCodes[language] || "en-IN";
    const voices = synth
      .getVoices()
      .filter((voice) => voice.localService === true);

    const voice =
      voices.find((v) => v.lang.toLowerCase() === target.toLowerCase()) ||
      voices.find((v) => v.lang.split("-")[0] === target.split("-")[0]);

    if (!voice) {
      alert(`No offline ${language} voice is available yet.`);
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.95;

    synth.speak(utterance);
  };

  // =====================================================
  // LANGUAGE CHANGE
  // =====================================================

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;

    setLanguage(selectedLanguage);

    localStorage.setItem("language", selectedLanguage);
  };

  // =====================================================
  // LOAD PROFILES
  // =====================================================

  useEffect(() => {
    if (!loggedIn || !userId) return;

    let cancelled = false;

    const fetchProfiles = async () => {
      try {
        const id = Number(localStorage.getItem("user_id"));

        if (!id || cancelled) return;

        const response = await fetch(`${API}/profiles/?user_id=${id}`);

        if (!response.ok) {
          throw new Error("Could not load profiles.");
        }

        const data = await response.json();

        if (!cancelled) {
          setProfiles(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Could not load profiles:", error);

        if (!cancelled) {
          setProfiles([]);
        }
      }
    };

    fetchProfiles();

    return () => {
      cancelled = true;
    };
  }, [loggedIn, userId]);

  // =====================================================
  // CREATE PROFILE
  // =====================================================

  const createProfile = async (event) => {
    event.preventDefault();

    setProfileMessage("");

    if (!profileName.trim()) {
      setProfileMessage("Please enter a profile name.");
      return;
    }

    if (!profileRelationship.trim()) {
      setProfileMessage("Please enter the relationship.");
      return;
    }

    if (!userId) {
      setProfileMessage("Please login first.");
      return;
    }

    setProfileLoading(true);

    try {
      const response = await fetch(`${API}/profiles/?user_id=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          name: profileName.trim(),
          relationship_type: profileRelationship.trim(),
          description: profileDescription.trim() || null,
          photo_url: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetails =
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail, null, 2);

        throw new Error(
          errorDetails ||
            `Could not create profile. Status: ${response.status}`,
        );
      }

      setProfiles((previous) => [...previous, data]);
      setProfileName("");
      setProfileRelationship("");
      setProfileDescription("");
      setShowProfileForm(false);
      setProfileMessage("Profile created successfully! 🎉");
    } catch (error) {
      console.error("Profile creation error:", error);
      setProfileMessage(error.message || "Could not create profile.");
    } finally {
      setProfileLoading(false);
    }
  };
  // =====================================================
  // GENERATE LIVING IDENTITY SUMMARY
  // =====================================================

  const generateIdentitySummary = async (profile) => {
    if (!userId) {
      setIdentityErrors((previous) => ({
        ...previous,
        [profile.id]: "Please log in first.",
      }));
      return;
    }

    setIdentityLoadingId(profile.id);

    setIdentityErrors((previous) => ({
      ...previous,
      [profile.id]: "",
    }));

    try {
      const response = await fetch(
        `${API}/profiles/${profile.id}/identity-summary?user_id=${userId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not generate identity summary.");
      }

      setIdentitySummaries((previous) => ({
        ...previous,
        [profile.id]: data.summary,
      }));
    } catch (error) {
      console.error("Identity summary error:", error);

      setIdentityErrors((previous) => ({
        ...previous,
        [profile.id]: error.message || "Something went wrong.",
      }));
    } finally {
      setIdentityLoadingId(null);
    }
  };
  // =====================================================
  // GENERATE AI LIFE STORY
  // =====================================================

  const generateLifeStory = async (profile) => {
    if (!userId) {
      setLifeStoryErrors((previous) => ({
        ...previous,
        [profile.id]: "Please log in first.",
      }));
      return;
    }

    setLifeStoryLoadingId(profile.id);

    setLifeStoryErrors((previous) => ({
      ...previous,
      [profile.id]: "",
    }));

    try {
      const response = await fetch(
        `${API}/profiles/${profile.id}/life-story?user_id=${userId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not generate life story.");
      }

      setLifeStories((previous) => ({
        ...previous,
        [profile.id]: data.story,
      }));
    } catch (error) {
      console.error("Life story error:", error);

      setLifeStoryErrors((previous) => ({
        ...previous,
        [profile.id]: error.message || "Something went wrong.",
      }));
    } finally {
      setLifeStoryLoadingId(null);
    }
  };
  // =====================================================
  // MEMORY TYPES
  // =====================================================

  const memoryTypes = [
    {
      value: "personal",
      label: ui.personal,
    },
    {
      value: "college",
      label: ui.college,
    },
    {
      value: "family",
      label: ui.family,
    },
    {
      value: "friends",
      label: ui.friends,
    },
    {
      value: "achievement",
      label: ui.achievement,
    },
    {
      value: "project",
      label: ui.project,
    },
    {
      value: "food",
      label: ui.food,
    },
    {
      value: "travel",
      label: ui.travel,
    },
    {
      value: "other",
      label: ui.other,
    },
  ];

  // =====================================================
  // LOGIN / SIGNUP PAGE
  // =====================================================

  if (!loggedIn) {
    return (
      <div className="app">
        <header className="header">
          <div className="brand">
            <div className="brand-icon">🧠</div>

            <div>
              <h1>Living Memory AI</h1>

              <p>{ui.memoriesLive}</p>
            </div>
          </div>
        </header>

        <main className="auth-container">
          <section className="auth-card">
            {!showSignup ? (
              <>
                <span className="hero-badge">✨ {ui.welcome}</span>

                <h2>{ui.preserveStory}</h2>

                <p className="auth-subtitle">{ui.welcomeText}</p>

                <form onSubmit={handleLogin}>
                  <input
                    type="email"
                    placeholder={ui.email}
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />

                  <input
                    type="password"
                    placeholder={ui.password}
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                  />

                  <button type="submit" disabled={authLoading}>
                    {authLoading ? ui.loggingIn : ui.login}
                  </button>
                </form>

                {authMessage && <p className="message">{authMessage}</p>}

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowSignup(true);
                    setAuthMessage("");
                  }}
                >
                  {ui.signup}
                </button>
              </>
            ) : (
              <>
                <span className="hero-badge">✨ {ui.startJourney}</span>

                <h2>{ui.createAccount}</h2>

                <p className="auth-subtitle">{ui.createText}</p>

                <form onSubmit={handleSignup}>
                  <input
                    type="text"
                    placeholder={ui.username}
                    value={authUsername}
                    onChange={(event) => setAuthUsername(event.target.value)}
                    required
                  />

                  <input
                    type="email"
                    placeholder={ui.email}
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />

                  <input
                    type="password"
                    placeholder={ui.password}
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                  />

                  <button type="submit" disabled={authLoading}>
                    {authLoading ? ui.creating : ui.createAccount}
                  </button>
                </form>

                {authMessage && <p className="message">{authMessage}</p>}

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowSignup(false);
                    setAuthMessage("");
                  }}
                >
                  {ui.alreadyAccount}
                </button>
              </>
            )}
          </section>
        </main>
      </div>
    );
  }

  // =====================================================
  // MAIN WEBSITE
  // =====================================================

  return (
    <div className="app">
      {/* ================= NAVBAR ================= */}

      <header className="header">
        <div className="brand">
          <div className="brand-icon">🧠</div>

          <div>
            <h1>Living Memory AI</h1>

            <p>{ui.memoriesLive}</p>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#home">{ui.home}</a>

          <a href="#features">{ui.features}</a>

          <a href="#memories">{ui.memories}</a>

          <a href="#profiles">👥 Profiles</a>

          <a href="#about">{ui.about}</a>
        </nav>

        {/* LANGUAGE SELECTOR */}

        <div className="language-selector">
          <span className="language-icon">🌐</span>

          <select
            value={language}
            onChange={handleLanguageChange}
            aria-label="Select language"
          >
            {languages.map((item) => (
              <option key={item.code} value={item.name}>
                {item.native}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="logout-button" onClick={handleLogout}>
          {ui.logout}
        </button>
      </header>

      <main id="home">
        {/* =================================================
            FUTURISTIC HERO
        ================================================= */}
        <section className="hero-section">
          {/* LEFT */}

          <div className="hero-left">
            <div className="hero-badge">✨ {ui.aiPowered}</div>

            <h1>{ui.heroTitle}</h1>

            <p className="hero-description">{ui.heroText}</p>

            <div className="hero-buttons">
              <a className="primary-btn hero-link" href="#save-memory">
                {ui.getStarted}
              </a>

              <a className="secondary-btn hero-link" href="#features">
                {ui.learnMore}
              </a>
            </div>

            <div className="memory-users">
              <div className="user-circles">
                <span>👩🏻</span>
                <span>👨🏻</span>
                <span>👩🏼</span>
                <span>👨🏽</span>
              </div>

              <p>
                {ui.preserveMoments}
                <br />
                {ui.thatMatter}
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <div className="hero-right">
            <div className="hero-visual">
              <img
                src="/memory-ai-hero.png"
                alt="Living Memory AI"
                className="hero-image"
              />

              {/* AI CARD */}

              <div className="memory-card ai-card">
                <span className="card-icon">🤖</span>

                <div>
                  <strong>{ui.aiMemoryChat}</strong>

                  <small>{ui.askPast}</small>
                </div>
              </div>

              {/* VOICE CARD */}

              <div className="memory-card voice-card">
                <span className="card-icon">🎙️</span>

                <div>
                  <strong>{ui.voiceMemoryCard}</strong>

                  <small>{ui.recordMoments}</small>
                </div>
              </div>

              {/* PHOTO CARD */}

              <div className="memory-card photo-card">
                <span className="card-icon">🖼️</span>

                <div>
                  <strong>{ui.photoMemoryCard}</strong>

                  <small>{ui.keepVisual}</small>
                </div>
              </div>

              {/* SECURE CARD */}

              <div className="memory-card secure-card">
                <span className="card-icon">🔐</span>

                <div>
                  <strong>{ui.privateMemories}</strong>

                  <small>{ui.secureAlways}</small>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* =================================================
            FEATURES
        ================================================= */}
        <section id="features">
          <h2>{ui.featuresTitle}</h2>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">✍️</div>

              <h3>{ui.textMemories}</h3>

              <p>{ui.textMemoriesDesc}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📸</div>

              <h3>{ui.photoMemories}</h3>

              <p>{ui.photoMemoriesDesc}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎤</div>

              <h3>{ui.voiceMemories}</h3>

              <p>{ui.voiceMemoriesDesc}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>

              <h3>{ui.aiChat}</h3>

              <p>{ui.aiChatDesc}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔎</div>

              <h3>{ui.smartSearch}</h3>

              <p>{ui.smartSearchDesc}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔐</div>

              <h3>{ui.secure}</h3>

              <p>{ui.secureDesc}</p>
            </div>
          </div>
        </section>
        {/* =================================================
            STATS
        ================================================= */}
        <section className="stats-section">
          <div className="stat">
            <h3>{memories.length}+</h3>

            <p>{ui.memoriesSaved}</p>
          </div>

          <div className="stat">
            <h3>3</h3>

            <p>{ui.memoryFormats}</p>
          </div>

          <div className="stat">
            <h3>AI</h3>

            <p>{ui.memoryAssistant}</p>
          </div>

          <div className="stat">
            <h3>24/7</h3>

            <p>{ui.storyAvailable}</p>
          </div>
        </section>
        {/* =================================================
            AI CHAT
        ================================================= */}
        <section className="chat-section">
          <h2>
            {chatProfileId
              ? `🧠 Chat with ${
                  profiles.find(
                    (profile) => String(profile.id) === String(chatProfileId),
                  )?.name || "Selected Profile"
                }`
              : `🧠 ${ui.talkMemories}`}
          </h2>

          <p
            style={{
              margin: "0 0 14px",
              fontSize: "14px",
              fontWeight: 600,
              opacity: 0.75,
            }}
          >
            🌐 {ui.aiResponses}{" "}
            {languages.find((item) => item.name === language)?.native ||
              language}
          </p>
          <label htmlFor="chat-profile">Chat with memories of:</label>

          <select
            id="chat-profile"
            className="chat-input"
            value={chatProfileId}
            onChange={(event) => setChatProfileId(event.target.value)}
          >
            <option value="">All my memories</option>

            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <p
            style={{
              margin: "6px 0 14px",
              fontSize: "13px",
              opacity: 0.75,
            }}
          >
            {chatProfileId
              ? "🔒 The AI will search only memories linked to this profile."
              : "💭 The AI can search across all your saved memories."}
          </p>
          <textarea
            className="chat-input"
            placeholder={ui.askPlaceholder}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                askAI();
              }
            }}
          />

          <button
            type="button"
            className="primary-button"
            onClick={() => askAI()}
            disabled={loadingAI}
          >
            {loadingAI ? ui.thinking : ui.askAI}
          </button>

          <div className="quick-questions">
            {ui.quickQuestions.map((item) => (
              <button
                type="button"
                key={item}
                className="quick-button"
                onClick={() => askAI(item)}
              >
                👤 {item}
              </button>
            ))}
          </div>

          <div className="chat-history">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <h3>🤖 Living Memory AI</h3>

                <p>{ui.askAnything}</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "chat-message user-message"
                      : "chat-message ai-message"
                  }
                >
                  <strong>
                    {message.role === "user"
                      ? `👤 ${ui.you}`
                      : "🤖 Living Memory AI"}
                  </strong>
                  {message.role === "assistant" && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => speakAIResponse(message.content)}
                    >
                      🔊 Listen
                    </button>
                  )}
                  <p>{message.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
        {/* =================================================
            SEARCH
        ================================================= */}
        <section className="search-section">
          <h2>🔎 {ui.findMemory}</h2>

          <div className="memory-search">
            <input
              type="text"
              placeholder={ui.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {search.trim() && (
            <div className="search-results">
              <h3>
                {ui.searchResultsFor} "{search}"
              </h3>

              {searchResults.length === 0 ? (
                <p className="empty">{ui.noResults}</p>
              ) : (
                <div className="memory-grid">
                  {searchResults.map((memory) => (
                    <article className="memory-card" key={memory.id}>
                      {memory.image_url && (
                        <img
                          src={`${API}${memory.image_url}`}
                          alt={memory.title}
                          className="memory-image"
                        />
                      )}

                      <span className="memory-type">
                        {memory.memory_type || "personal"}
                      </span>

                      <h3>{memory.title}</h3>

                      <p>{memory.content}</p>

                      <div className="memory-actions">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => startEditingMemory(memory)}
                        >
                          {ui.edit}
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDeleteMemory(memory.id)}
                        >
                          {ui.delete}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
        {/* =================================================
            EDIT MEMORY
        ================================================= */}
        {editingMemoryId && (
          <section className="card">
            <h2>{ui.editMemory}</h2>

            <form onSubmit={handleUpdateMemory}>
              <input
                type="text"
                placeholder={ui.titlePlaceholder}
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                required
              />

              <textarea
                placeholder={ui.memoryPlaceholder}
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                required
              />

              <select
                value={editMemoryType}
                onChange={(event) => setEditMemoryType(event.target.value)}
              >
                {memoryTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <label htmlFor="edit-profile">Linked Profile:</label>
              <select
                id="edit-profile"
                value={editProfileId}
                onChange={(event) => setEditProfileId(event.target.value)}
              >
                <option value="">No profile assigned</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>

              <div className="memory-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={editLoading}
                >
                  {editLoading ? ui.saving : ui.saveChanges}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEditingMemory}
                >
                  {ui.cancel}
                </button>
              </div>
            </form>

            {memoryMessage && <p className="message">{memoryMessage}</p>}
          </section>
        )}
        {/* =================================================
            SAVE MEMORY
        ================================================= */}
        <section id="save-memory">
          <h2>✨ {ui.saveMemory}</h2>

          <form onSubmit={handleSaveMemory}>
            <input
              type="text"
              placeholder={ui.titlePlaceholder}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <textarea
              placeholder={ui.memoryPlaceholder}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
            />

            <VoiceRecorder
              onTextGenerated={(text) =>
                setContent((previous) =>
                  previous ? `${previous} ${text}` : text,
                )
              }
              onAudioRecorded={(audioBlob) => {
                setSelectedAudio(audioBlob);

                setMemoryMessage(ui.voiceRecorded);
              }}
            />

            {selectedAudio && <p className="message">{ui.voiceReady}</p>}

            <div className="photo-upload">
              <label htmlFor="memory-image" className="photo-upload-label">
                {ui.addPhoto}
              </label>

              <input
                id="memory-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
              />

              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Memory preview" />

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={clearSelectedImage}
                  >
                    {ui.removePhoto}
                  </button>
                </div>
              )}
            </div>
            <label htmlFor="memory-profile">Whose memory is this?</label>

            <select
              id="memory-profile"
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
            >
              <option value="">General memory — no profile</option>

              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.relationship_type})
                </option>
              ))}
            </select>
            <select
              value={memoryType}
              onChange={(event) => setMemoryType(event.target.value)}
            >
              {memoryTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="primary-button"
              disabled={saving || uploadingImage || uploadingAudio}
            >
              {saving || uploadingImage || uploadingAudio ? ui.saving : ui.save}
            </button>
          </form>

          {memoryMessage && <p className="message">{memoryMessage}</p>}
        </section>
        {/* =================================================
            MY MEMORIES
        ================================================= */}
        <section id="memories">
          <div className="section-heading">
            <h2>💜 {ui.myMemories}</h2>

            <button
              type="button"
              className="refresh-button"
              onClick={loadMemories}
            >
              {ui.refresh}
            </button>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setActiveProfileFilter(null)}
          >
            Show All Memories
          </button>
          <div className="memory-filters">
            <div className="memory-filters-header">
              <div>
                <h3>Filter memories</h3>
                <p>Find moments by category or date range.</p>
              </div>
              <button
                type="button"
                className="clear-filters-button"
                onClick={() => {
                  setMemoryTypeFilter("");
                  setDateFromFilter("");
                  setDateToFilter("");
                }}
              >
                ↺ Clear all
              </button>
            </div>

            <div className="memory-filter-fields">
              <div className="memory-filter-field">
                <label htmlFor="memory-profile-filter">Profile</label>

                <select
                  id="memory-profile-filter"
                  value={
                    activeProfileFilter === null
                      ? ""
                      : String(activeProfileFilter)
                  }
                  onChange={(event) => {
                    const value = event.target.value;

                    setActiveProfileFilter(
                      value === ""
                        ? null
                        : value === "unassigned"
                          ? "unassigned"
                          : Number(value),
                    );
                  }}
                >
                  <option value="">All profiles</option>
                  <option value="unassigned">Unassigned memories</option>

                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="memory-filter-field">
                <label htmlFor="memory-type-filter">Category</label>
                <select
                  id="memory-type-filter"
                  value={memoryTypeFilter}
                  onChange={(event) => setMemoryTypeFilter(event.target.value)}
                >
                  <option value="">All categories</option>
                  <option value="personal">Personal</option>
                  <option value="college">College</option>
                  <option value="family">Family</option>
                  <option value="friends">Friends</option>
                  <option value="achievement">Achievement</option>
                  <option value="project">Project</option>
                  <option value="food">Food</option>
                  <option value="travel">Travel</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="memory-filter-field">
                <label htmlFor="memory-date-from">From date</label>
                <input
                  id="memory-date-from"
                  type="date"
                  value={dateFromFilter}
                  onChange={(event) => setDateFromFilter(event.target.value)}
                />
              </div>

              <div className="memory-filter-field">
                <label htmlFor="memory-date-to">To date</label>
                <input
                  id="memory-date-to"
                  type="date"
                  value={dateToFilter}
                  onChange={(event) => setDateToFilter(event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="memory-results-count">
            Showing <strong>{visibleMemories.length}</strong>{" "}
            {visibleMemories.length === 1 ? "memory" : "memories"}
          </div>
          {memories.length === 0 ? (
            <div className="empty">
              <h3>{ui.waiting}</h3>
              <p>{ui.firstMemory}</p>
            </div>
          ) : visibleMemories.length === 0 ? (
            <div className="empty">
              <h3>No matching memories</h3>
              <p>Try changing the category or date filters.</p>
            </div>
          ) : (
            <div className="memory-grid">
              {visibleMemories.map((memory) => (
                <article className="memory-card" key={memory.id}>
                  {memory.image_url && (
                    <img
                      src={`${API}${memory.image_url}`}
                      alt={memory.title}
                      className="memory-image"
                    />
                  )}

                  {memory.audio_url && (
                    <audio
                      controls
                      className="memory-audio"
                      src={`${API}${memory.audio_url}`}
                    />
                  )}

                  <span className="memory-type">
                    {memory.memory_type || "personal"}
                  </span>
                  {memory.profile_id && (
                    <span className="memory-type">
                      👤{" "}
                      {profiles.find(
                        (profile) =>
                          Number(profile.id) === Number(memory.profile_id),
                      )?.name || "Linked profile"}
                    </span>
                  )}
                  <h3>{memory.title}</h3>

                  <p>{memory.content}</p>

                  <div className="memory-meta">
                    <span>{memory.memory_type || "personal"}</span>

                    {memory.created_at && (
                      <span>
                        {new Date(memory.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="memory-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => startEditingMemory(memory)}
                    >
                      {ui.edit}
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteMemory(memory.id)}
                    >
                      {ui.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        {/* =================================================
            PROFILES
        ================================================= */}
        {/* =================================================
            PROFILES
        ================================================= */}

        <section id="profiles" className="profiles-section">
          <div className="section-heading">
            <span className="section-label">{profileUi.label}</span>

            <h2>{profileUi.title}</h2>

            <p>{profileUi.description}</p>
          </div>

          <div className="profiles-grid">
            <article className="profile-card">
              <div className="profile-avatar">👩</div>

              <h3>{profileMoreUi.mom}</h3>

              <span className="profile-relation">{profileUi.mother}</span>

              <p>{profileUi.motherDescription}</p>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setActiveProfileFilter(null);
                  setSearch("Mom");

                  document.getElementById("memories")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                {profileUi.viewMemories}
              </button>
            </article>

            <article className="profile-card">
              <div className="profile-avatar">👨</div>

              <h3>{profileMoreUi.dad}</h3>

              <span className="profile-relation">{profileUi.father}</span>

              <p>{profileUi.fatherDescription}</p>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setSearch("Dad");

                  document.getElementById("memories")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                {profileUi.viewMemories}
              </button>
            </article>

            {profiles.map((profile) => (
              <article className="profile-card" key={profile.id}>
                <div className="profile-avatar">👤</div>

                <h3>{profile.name}</h3>

                <span className="profile-relation">
                  {profile.relationship_type}
                </span>

                <p>{profile.description || profileMoreUi.defaultDescription}</p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => generateIdentitySummary(profile)}
                  disabled={identityLoadingId === profile.id}
                >
                  {identityLoadingId === profile.id
                    ? profileMoreUi.generatingSummary
                    : profileUi.generateSummary}
                </button>

                {identityErrors[profile.id] && (
                  <p className="message">{identityErrors[profile.id]}</p>
                )}

                {identitySummaries[profile.id] && (
                  <div className="identity-summary">
                    <h4>{profileMoreUi.livingIdentity}</h4>
                    <p>{identitySummaries[profile.id]}</p>
                  </div>
                )}
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => generateLifeStory(profile)}
                  disabled={lifeStoryLoadingId === profile.id}
                >
                  {lifeStoryLoadingId === profile.id
                    ? profileMoreUi.writingLifeStory
                    : profileUi.generateLifeStory}
                </button>

                {lifeStoryErrors[profile.id] && (
                  <p className="message">{lifeStoryErrors[profile.id]}</p>
                )}

                {lifeStories[profile.id] && (
                  <div className="identity-summary">
                    <h4>
                      {profileMoreUi.lifeStoryTitle.replace(
                        "{name}",
                        profile.name,
                      )}
                    </h4>

                    <p style={{ whiteSpace: "pre-wrap" }}>
                      {lifeStories[profile.id]}
                    </p>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            lifeStories[profile.id],
                          );
                          window.alert(profileMoreUi.copySuccess);
                        } catch {
                          window.alert(profileMoreUi.copyFail);
                        }
                      }}
                    >
                      {profileMoreUi.copyLifeStory}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setActiveProfileFilter(profile.id);
                    setSearch("");

                    document.getElementById("memories")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  {profileUi.viewMemories}
                </button>
              </article>
            ))}

            <article className="profile-card add-profile-card">
              <div className="profile-avatar">＋</div>

              <h3>{profileMoreUi.addProfile}</h3>

              <p>{profileMoreUi.addProfileDescription}</p>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowProfileForm(true);
                  setProfileMessage("");
                }}
              >
                {profileMoreUi.createProfile}
              </button>
            </article>
          </div>

          {showProfileForm && (
            <form className="card" onSubmit={createProfile}>
              <h3>{profileMoreUi.createRelationshipProfile}</h3>

              <input
                type="text"
                placeholder={profileMoreUi.name}
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                required
              />

              <input
                type="text"
                placeholder={profileMoreUi.relationship}
                value={profileRelationship}
                onChange={(event) => setProfileRelationship(event.target.value)}
                required
              />

              <textarea
                placeholder={profileMoreUi.description}
                value={profileDescription}
                onChange={(event) => setProfileDescription(event.target.value)}
              />

              <div className="memory-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={profileLoading}
                >
                  {profileLoading
                    ? profileMoreUi.creating
                    : profileMoreUi.createProfile.replace("+ ", "")}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowProfileForm(false);
                    setProfileMessage("");
                  }}
                >
                  {profileMoreUi.cancel}
                </button>
              </div>

              {profileMessage && <p className="message">{profileMessage}</p>}
            </form>
          )}
        </section>
        {/* =================================================
            PERSONAL MEMORY TIMELINE
        ================================================= */}
        <section className="card">
          <h2>
            {selectedTimelineProfile
              ? `🕰️ ${selectedTimelineProfile.name}${timelineUi.personTitleSuffix}`
              : timelineProfileId === "unassigned"
                ? timelineUi.unassignedTitle
                : timelineUi.personalTitle}
          </h2>
          <p>{timelineUi.description}</p>

          <label htmlFor="timeline-profile">{timelineUi.showFor}</label>
          <select
            id="timeline-profile"
            value={timelineProfileId}
            onChange={(event) => setTimelineProfileId(event.target.value)}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "420px",
              padding: "10px 12px",
              margin: "8px 0 18px",
              borderRadius: "8px",
            }}
          >
            <option value="">{timelineUi.allProfiles}</option>
            <option value="unassigned">{timelineUi.unassignedMemories}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={String(profile.id)}>
                {profile.name}
              </option>
            ))}
          </select>

          {timelineMemories.length === 0 ? (
            <p>
              {timelineProfileId
                ? timelineUi.noLinkedMemories
                : timelineUi.noMemories}
            </p>
          ) : (
            <div
              style={{
                marginTop: "20px",
                marginLeft: "10px",
                paddingLeft: "20px",
                borderLeft: "2px solid #a78bfa",
              }}
            >
              {timelineMemories.map((memory) => {
                const linkedProfile = profiles.find(
                  (profile) => String(profile.id) === String(memory.profile_id),
                );

                return (
                  <article
                    key={`timeline-${memory.id}`}
                    style={{
                      marginBottom: "24px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "-27px",
                        top: "5px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#a78bfa",
                      }}
                    />

                    <small>
                      {memory.created_at
                        ? new Date(memory.created_at).toLocaleDateString(
                            languageLocales[language] || "en-US",
                          )
                        : timelineUi.dateUnavailable}
                    </small>

                    <h3>{memory.title}</h3>
                    <p>{memory.content}</p>

                    <div className="memory-meta">
                      <span>
                        {linkedProfile?.name || timelineUi.unassignedMemory}
                      </span>
                      <span>
                        {ui[memory.memory_type] ||
                          memory.memory_type ||
                          ui.personal}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
            ABOUT
        ================================================= */}
        <section id="about" className="about-card">
          <h2>{ui.aboutTitle}</h2>

          <p>{ui.aboutText}</p>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>

              <h3>{ui.memoryStorage}</h3>

              <p>{ui.memoryStorageDesc}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎤</div>

              <h3>{ui.voiceMemory}</h3>

              <p>{ui.voiceMemoryDesc}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📸</div>

              <h3>{ui.photoMemory}</h3>

              <p>{ui.photoMemoryDesc}</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>

              <h3>{ui.aiConversation}</h3>

              <p>{ui.aiConversationDesc}</p>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>
        <h2>🧠 Living Memory AI</h2>

        <p>{ui.memoriesLive}</p>

        <p>{ui.footerCopy}</p>
      </footer>
    </div>
  );
}

export default App;
