import { useCallback, useEffect, useState } from "react";
import "./App.css";
import VoiceRecorder from "./VoiceRecorder";

const API = "http://127.0.0.1:8000";

function App() {
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

  const [memories, setMemories] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [memoryType, setMemoryType] = useState("personal");

  const [saving, setSaving] = useState(false);
  const [memoryMessage, setMemoryMessage] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [selectedAudio, setSelectedAudio] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const [editingMemoryId, setEditingMemoryId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editMemoryType, setEditMemoryType] = useState("personal");
  const [editLoading, setEditLoading] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  /* =====================================================
     IMAGE
  ===================================================== */

  const handleImageSelect = (event) => {
    const file = event.target.files[0];

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

  /* =====================================================
     AUDIO
  ===================================================== */

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

  /* =====================================================
     SIGNUP
  ===================================================== */

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

  /* =====================================================
     LOGIN
  ===================================================== */

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

  /* =====================================================
     LOGOUT
  ===================================================== */

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
  };

  /* =====================================================
     LOAD MEMORIES
  ===================================================== */

  const loadMemories = async () => {
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
  };

  useEffect(() => {
    if (!loggedIn || !userId) return;

    const timer = setTimeout(() => {
      loadMemories();
    }, 0);

    return () => clearTimeout(timer);
  }, [loggedIn, userId]);

  /* =====================================================
     SAVE MEMORY
  ===================================================== */

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

  /* =====================================================
     SEARCH
  ===================================================== */

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

  /* =====================================================
     EDIT MEMORY
  ===================================================== */

  const startEditingMemory = (memory) => {
    setEditingMemoryId(memory.id);
    setEditTitle(memory.title || "");
    setEditContent(memory.content || "");
    setEditMemoryType(memory.memory_type || "personal");

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not update memory.");
      }

      setMemoryMessage("Memory updated successfully! ✨");

      cancelEditingMemory();

      await loadMemories();

      if (search.trim()) {
        await searchMemories();
      }
    } catch (error) {
      console.error("Update memory error:", error);

      setMemoryMessage(error.message || "Could not update memory.");
    } finally {
      setEditLoading(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDeleteMemory = async (memoryId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this memory?",
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API}/memories/${memoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete memory.");
      }

      if (Number(editingMemoryId) === Number(memoryId)) {
        cancelEditingMemory();
      }

      await loadMemories();

      if (search.trim()) {
        await searchMemories();
      }
    } catch (error) {
      console.error("Delete error:", error);

      alert("Could not delete memory.");
    }
  };

  /* =====================================================
     AI CHAT
  ===================================================== */

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

  const quickQuestions = [
    "What project am I currently working on?",
    "Tell me about my college journey.",
    "What are some important things I have saved?",
  ];

  /* =====================================================
     LOGIN / SIGNUP PAGE
  ===================================================== */

  if (!loggedIn) {
    return (
      <div className="app">
        <header className="header">
          <div className="brand">
            <div className="brand-icon">🧠</div>

            <div>
              <h1>Living Memory AI</h1>
              <p>Memories live forever.</p>
            </div>
          </div>
        </header>

        <main className="auth-container">
          <section className="auth-card">
            {!showSignup ? (
              <>
                <span className="hero-badge">✨ Welcome back</span>

                <h2>Preserve Your Story</h2>

                <p className="auth-subtitle">
                  Keep your precious memories safe and talk to them anytime.
                </p>

                <form onSubmit={handleLogin}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                  />

                  <button type="submit" disabled={authLoading}>
                    {authLoading ? "Logging in..." : "Login →"}
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
                  Don't have an account? Sign up
                </button>
              </>
            ) : (
              <>
                <span className="hero-badge">✨ Start your memory journey</span>

                <h2>Create Your Account</h2>

                <p className="auth-subtitle">
                  Create a private space for your stories, photos and voice
                  memories.
                </p>

                <form onSubmit={handleSignup}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={authUsername}
                    onChange={(event) => setAuthUsername(event.target.value)}
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                  />

                  <button type="submit" disabled={authLoading}>
                    {authLoading ? "Creating..." : "Create Account →"}
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
                  Already have an account? Login
                </button>
              </>
            )}
          </section>
        </main>
      </div>
    );
  }

  /* =====================================================
     MAIN WEBSITE
  ===================================================== */

  return (
    <div className="app">
      {/* ================= NAVBAR ================= */}

      <header className="header">
        <div className="brand">
          <div className="brand-icon">🧠</div>

          <div>
            <h1>Living Memory AI</h1>
            <p>Memories live forever.</p>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#memories">Memories</a>
          <a href="#about">About</a>
        </nav>

        <button type="button" className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main id="home">
        {/* =================================================
            FUTURISTIC HERO
        ================================================= */}

        <section className="hero-section">
          {/* LEFT */}

          <div className="hero-left">
            <div className="hero-badge">✨ AI Powered Memory Keeper</div>

            <h1>
              Your Memories.
              <br />
              Your Legacy.
            </h1>

            <p className="hero-description">
              Living Memory AI helps you preserve your precious memories,
              stories, photos and voices in one secure place and lets you relive
              them anytime.
            </p>

            <div className="hero-buttons">
              <a className="primary-btn hero-link" href="#save-memory">
                Get Started →
              </a>

              <a className="secondary-btn hero-link" href="#features">
                ▶ Learn More
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
                Preserve the moments
                <br />
                that matter most.
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
                  <strong>AI Memory Chat</strong>

                  <small>Ask about your past.</small>
                </div>
              </div>

              {/* VOICE CARD */}

              <div className="memory-card voice-card">
                <span className="card-icon">🎙️</span>

                <div>
                  <strong>Voice Memory</strong>

                  <small>Record precious moments.</small>
                </div>
              </div>

              {/* PHOTO CARD */}

              <div className="memory-card photo-card">
                <span className="card-icon">🖼️</span>

                <div>
                  <strong>Photo Memory</strong>

                  <small>Keep memories visual.</small>
                </div>
              </div>

              {/* SECURE CARD */}

              <div className="memory-card secure-card">
                <span className="card-icon">🔐</span>

                <div>
                  <strong>Private Memories</strong>

                  <small>Secure. Private. Always yours.</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FEATURES
        ================================================= */}

        <section id="features">
          <h2>Everything Your Memories Need</h2>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">✍️</div>
              <h3>Text Memories</h3>
              <p>Write down your thoughts, stories and special moments.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Photo Memories</h3>
              <p>Upload and store photos safely with your memories.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3>Voice Memories</h3>
              <p>Record your precious words and conversations.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Chat</h3>
              <p>Talk with your memories using AI and revisit the past.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔎</div>
              <h3>Smart Search</h3>
              <p>Find your memories quickly using keywords.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure & Private</h3>
              <p>Your memories stay connected to your personal account.</p>
            </div>
          </div>
        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="stats-section">
          <div className="stat">
            <h3>{memories.length}+</h3>
            <p>Memories Saved</p>
          </div>

          <div className="stat">
            <h3>3</h3>
            <p>Memory Formats</p>
          </div>

          <div className="stat">
            <h3>AI</h3>
            <p>Memory Assistant</p>
          </div>

          <div className="stat">
            <h3>24/7</h3>
            <p>Your Story Available</p>
          </div>
        </section>

        {/* =================================================
            AI CHAT
        ================================================= */}

        <section className="chat-section">
          <h2>🤖 Talk to Your Memories</h2>

          <textarea
            className="chat-input"
            placeholder="Ask something about your memories..."
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
            {loadingAI ? "Thinking..." : "Ask Living Memory AI"}
          </button>

          <div className="quick-questions">
            {quickQuestions.map((item) => (
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

                <p>Ask me anything about your saved memories.</p>
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
                    {message.role === "user" ? "👤 You" : "🤖 Living Memory AI"}
                  </strong>

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
          <h2>🔎 Find a Memory</h2>

          <div className="memory-search">
            <input
              type="text"
              placeholder="Search your memories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {search.trim() && (
            <div className="search-results">
              <h3>Results for "{search}"</h3>

              {searchResults.length === 0 ? (
                <p className="empty">No matching memories found.</p>
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
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDeleteMemory(memory.id)}
                        >
                          🗑️ Delete
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
            <h2>✏️ Edit Memory</h2>

            <form onSubmit={handleUpdateMemory}>
              <input
                type="text"
                placeholder="Memory title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                required
              />

              <textarea
                placeholder="Edit your memory..."
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                required
              />

              <select
                value={editMemoryType}
                onChange={(event) => setEditMemoryType(event.target.value)}
              >
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

              <div className="memory-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "💾 Save Changes"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEditingMemory}
                >
                  Cancel
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
          <h2>✨ Save a New Memory</h2>

          <form onSubmit={handleSaveMemory}>
            <input
              type="text"
              placeholder="Give your memory a title..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <textarea
              placeholder="Write your memory here..."
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

                setMemoryMessage("🎤 Voice recorded. Save the memory.");
              }}
            />

            {selectedAudio && (
              <p className="message">🎤 Voice recording ready to save.</p>
            )}

            <div className="photo-upload">
              <label htmlFor="memory-image" className="photo-upload-label">
                📸 Add a Photo
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
                    ❌ Remove Photo
                  </button>
                </div>
              )}
            </div>

            <select
              value={memoryType}
              onChange={(event) => setMemoryType(event.target.value)}
            >
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

            <button
              type="submit"
              className="primary-button"
              disabled={saving || uploadingImage || uploadingAudio}
            >
              {saving || uploadingImage || uploadingAudio
                ? "Saving..."
                : "Save Memory 💜"}
            </button>
          </form>

          {memoryMessage && <p className="message">{memoryMessage}</p>}
        </section>

        {/* =================================================
            MY MEMORIES
        ================================================= */}

        <section id="memories">
          <div className="section-heading">
            <h2>💜 My Memories</h2>

            <button
              type="button"
              className="refresh-button"
              onClick={loadMemories}
            >
              🔄 Refresh
            </button>
          </div>

          {memories.length === 0 ? (
            <div className="empty">
              <h3>Your memory collection is waiting ✨</h3>

              <p>Save your first special moment above.</p>
            </div>
          ) : (
            <div className="memory-grid">
              {memories.map((memory) => (
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
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDeleteMemory(memory.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            ABOUT
        ================================================= */}

        <section id="about" className="about-card">
          <h2>🌟 About Living Memory AI</h2>

          <p>
            A personal digital space where your stories, photos and voice
            memories can be preserved and explored through AI.
          </p>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>

              <h3>Memory Storage</h3>

              <p>Save important personal memories.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎤</div>

              <h3>Voice Memory</h3>

              <p>Speak your memories instead of typing.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📸</div>

              <h3>Photo Memories</h3>

              <p>Attach photos to meaningful moments.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>

              <h3>AI Conversation</h3>

              <p>Ask questions about your saved memories.</p>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>
        <h2>🧠 Living Memory AI</h2>

        <p>Memories live forever.</p>

        <p>© 2026 Living Memory AI — Your memories, your story.</p>
      </footer>
    </div>
  );
}

export default App;
