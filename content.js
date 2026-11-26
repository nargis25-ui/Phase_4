const API_KEY = "";
const MODEL = "gemini-3.8-flash";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const form = document.querySelector("#generatorForm");
const userInput = document.querySelector("#userInput");
const generateBtn = document.querySelector("#generateBtn");
const buttonText = document.querySelector("#buttonText");
const result = document.querySelector("#result");
const placeholder = document.querySelector("#resultPlaceholder");
const errorMessage = document.querySelector("#errorMessage");
const copyBtn = document.querySelector("#copyBtn");
const clearBtn = document.querySelector("#clearBtn");
const charCount = document.querySelector("#charCount");
const inputLabel = document.querySelector("#inputLabel");
const inputHint = document.querySelector("#inputHint");
const modeTitle = document.querySelector("#modeTitle");
const modeTag = document.querySelector("#modeTag");

let currentMode = "ask";
let isLoading = false;
let lastResponse = "";

const featureSettings = {
  ask: {
    title: "Ask Me Anything",
    tag: "Q&A",
    label: "What would you like to know?",
    placeholder: "For example: Explain JavaScript promises...",
    hint: "Ask a question about any topic.",
    button: "Generate Answer",
    instruction:
      "Answer the user's question clearly. Use simple language and examples when helpful."
  },

  summarize: {
    title: "Quick Summarizer",
    tag: "SUMMARY",
    label: "Paste the text you want to summarize",
    placeholder: "Paste your article, notes, or paragraph here...",
    hint: "Long text becomes easier to understand.",
    button: "Summarize Text",
    instruction:
      "Summarize the supplied text concisely. Include its main points without adding unsupported facts."
  },

  ideas: {
    title: "Idea Spark",
    tag: "IDEAS",
    label: "What do you need ideas about?",
    placeholder: "For example: Give me 10 beginner JavaScript project ideas...",
    hint: "Describe a topic or goal to explore.",
    button: "Generate Ideas",
    instruction:
      "Generate 8 creative, practical ideas. Number them and briefly explain each one."
  },

  define: {
    title: "Definition Finder",
    tag: "LEARN",
    label: "Which word or concept do you want to understand?",
    placeholder: "For example: API, destructuring, or artificial intelligence...",
    hint: "Learn the meaning with a simple example.",
    button: "Find Definition",
    instruction:
      "Define the supplied term in simple language. Include a real-world analogy and a technical example."
  }
};

const updateFeature = (mode) => {
  const settings = featureSettings[mode];

  // Prevent errors if an unknown mode is selected.
  if (!settings) return;

  currentMode = mode;

  const {
    title,
    tag,
    label,
    placeholder: inputPlaceholder,
    hint,
    button
  } = settings;

  modeTitle.textContent = title;
  modeTag.textContent = tag;
  inputLabel.textContent = label;
  userInput.placeholder = inputPlaceholder;
  inputHint.textContent = hint;
  buttonText.textContent = button;

  document.querySelectorAll(".feature").forEach((feature) => {
    feature.classList.toggle(
      "active",
      feature.dataset.mode === mode
    );
  });

  userInput.value = "";

  updateCharacterCount();
  clearResult();
};

const updateCharacterCount = () => {
  charCount.textContent = `${userInput.value.length} / 12000`;
};

const clearResult = () => {
  result.textContent = "";
  errorMessage.textContent = "";
  lastResponse = "";

  placeholder.hidden = false;
  placeholder.textContent =
    "Your generated content will appear here.";

  copyBtn.disabled = true;
  copyBtn.textContent = "Copy";
};

const setLoading = (loading) => {
  isLoading = loading;
  generateBtn.disabled = loading;

  buttonText.textContent = loading
    ? "Generating..."
    : featureSettings[currentMode].button;
};

const joinPromptLines = (...lines) => lines.join("\n");

const createRequestBody = (prompt) => ({
  contents: [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ],

  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 1200
  }
});

const generateContent = async (prompt) => {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": API_KEY
    },

    body: JSON.stringify(createRequestBody(prompt))
  });

  // Handle HTTP errors from the API.
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    const message =
      errorData.error?.message || `HTTP ${response.status}`;

    throw new Error(message);
  }

  const data = await response.json();

  // Extract the generated text safely.
  const { candidates = [] } = data;

  const answer = candidates
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .filter((text) => text.trim().length > 0)
    .join("\n");

  if (!answer) {
    throw new Error(
      "Gemini returned no text. Please try a different prompt."
    );
  }

  return answer;
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isLoading) return;

  const userText = userInput.value.trim();

  // Validate user input.
  if (!userText) {
    errorMessage.textContent =
      "Please enter some text first.";
    userInput.focus();
    return;
  }

  // Validate API key.
  if (
    !API_KEY.trim() ||
    API_KEY === "YOUR_GEMINI_API_KEY"
  ) {
    errorMessage.textContent =
      "Please add your Gemini API key in script.js.";
    return;
  }

  const settings = featureSettings[currentMode];

  const prompt = joinPromptLines(
    "You are a helpful AI assistant.",
    settings.instruction,
    `Feature: ${settings.title}`,
    `User input:\n${userText}`,
    "Use readable formatting. Be accurate and helpful."
  );

  // Prepare the interface.
  clearResult();
  placeholder.hidden = true;
  result.textContent = "Connecting to Gemini...";

  setLoading(true);

  try {
    const answer = await generateContent(prompt);

    // Display the answer safely as plain text.
    result.textContent = answer;
    lastResponse = answer;
    copyBtn.disabled = false;

  } catch (error) {
    result.textContent = "";

    placeholder.hidden = false;
    placeholder.textContent =
      "Unable to generate content.";

    errorMessage.textContent =
      `Error: ${error.message}`;

    console.error("Gemini request failed:", error);

  } finally {
    setLoading(false);
  }
});

document.querySelectorAll(".feature").forEach((feature) => {
  feature.addEventListener("click", () => {
    updateFeature(feature.dataset.mode);
  });
});

userInput.addEventListener("input", () => {
  updateCharacterCount();

  // Enforce the 12,000-character input limit.
  if (userInput.value.length > 12000) {
    userInput.value = userInput.value.slice(0, 12000);
    updateCharacterCount();
  }
});

clearBtn.addEventListener("click", () => {
  userInput.value = "";

  updateCharacterCount();
  clearResult();

  userInput.focus();
});

copyBtn.addEventListener("click", async () => {
  if (!lastResponse) return;

  try {
    await navigator.clipboard.writeText(lastResponse);

    copyBtn.textContent = "Copied!";

  } catch (error) {
    errorMessage.textContent =
      "Copy failed. Select the response and copy it manually.";

    console.error("Clipboard error:", error);
  }
});

updateFeature("ask");

console.log("AI Content Generator initialized successfully.");


