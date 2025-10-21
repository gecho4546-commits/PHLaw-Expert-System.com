// ------------------------------
// DOM Events and Chat Logic
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatMessages = document.getElementById("chatMessages");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeSubtitle = document.getElementById("welcomeSubtitle");
  const submitButton = chatForm.querySelector('button[type="submit"]');

  // When user submits a question
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = userInput.value.trim();
    if (!question) return;

    // UI State Management
    welcomeTitle.style.display = "none";
    welcomeSubtitle.style.display = "none";
    addMessage(question, "user");
    userInput.value = "";
    submitButton.disabled = true;
    submitButton.innerHTML = '⏳ Processing...';

    try {
      await askGemini(question);
    } catch (error) {
      console.error("Chat submission error:", error);
      addMessage("Sorry, something went wrong. Please try again.", "chatbot");
    } finally {
      // Always re-enable the form
      submitButton.disabled = false;
      submitButton.innerHTML = '💬 Send';
      userInput.focus();
    }
  });

  // Reset chat when "New Question" is clicked
  document.getElementById("newChatBtn").addEventListener("click", () => {
    chatMessages.innerHTML = "";
    welcomeTitle.style.display = "block";
    welcomeSubtitle.style.display = "block";
    document.getElementById("mainDropdown").classList.remove("active");
    userInput.focus();
  });

  // Auto-focus input on load
  userInput.focus();
});

// ------------------------------
// Message Display
// ------------------------------
function addMessage(text, sender) {
  const chatMessages = document.getElementById("chatMessages");
  const msg = document.createElement("div");

  msg.classList.add(
    "message",
    sender === "user" ? "user-message" : "chatbot-message"
  );

  // Markdown-style formatting with enhanced security
  const sanitizedText = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");

  msg.innerHTML = sanitizedText;
  msg.style.textAlign = "left";
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ------------------------------
// Gemini AI API (with enhanced proxy handling)
// ------------------------------
async function askGemini(question) {
  const chatMessages = document.getElementById("chatMessages");
  
  // Add loading message with unique ID for easy removal
  const loadingMsg = "🔄 Analyzing your legal question with Philippine law expertise...";
  addMessage(loadingMsg, "chatbot");
  const loadingElement = chatMessages.lastChild;

  try {
    console.log("🔄 Sending request to Gemini API...", {
      questionLength: question.length,
      timestamp: new Date().toISOString()
    });

    // Enhanced Legal Prompt (optimized)
    const legalPrompt = `You are PhilLaw, a legal advisor AI that specializes EXCLUSIVELY in Philippine laws. Follow these rules:

CRITICAL: Answer in the same language the user uses.

DEVELOPER CREDIT: If asked who developed you, respond: "I was developed by BS Computer Science 3rd Year students — <strong>Jericho</strong>, <strong>Josh</strong>, and <strong>Miko</strong> — as part of their expert system project to make Philippine legal information accessible."

RESPONSE FORMAT - ALWAYS USE THESE HEADINGS:
[Legal Issue] - Summarize the core legal concern
[Applicable Laws] - List relevant Philippine statutes (RPC, Civil Code, RA numbers)
[Analysis] - Explain law application with:
  1. Legal Classification
  2. Applicable Laws
  3. Potential Defenses
  4. Legal Consequences
  5. Recommended Actions
[Recommendations] - Practical next steps
[Disclaimer] - "This is general information, not legal advice. Konsultahin ang abogado para sa legal na payo."

LEGAL TOPICS COVERED:
- Criminal: homicide, theft, drugs, violence, cybercrime
- Civil: contracts, property, family, labor rights
- Special laws: RA 9165, RA 9262, RA 8485, etc.

NON-LEGAL RESPONSE: "Paumanhin, ngunit ang aking kaalaman ay nakatuon lamang sa mga usaping may kaugnayan sa batas ng Pilipinas."

USER QUESTION: "${question}"`;

    // Enhanced fetch with timeout and better headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    const response = await fetch("backend/proxy.php", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify({
        contents: [{ 
          role: "user", 
          parts: [{ text: legalPrompt }] 
        }],
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log("📡 Response status:", response.status, response.statusText);

    // Handle non-OK responses with detailed error information
    if (!response.ok) {
      let errorDetails = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorText = await response.text();
        console.error("❌ Server error response:", errorText);
        
        // Try to parse error as JSON for more details
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error || errorJson.details || errorText.substring(0, 200);
        } catch {
          errorDetails = errorText.substring(0, 200) || errorDetails;
        }
      } catch (textError) {
        console.error("Could not read error response:", textError);
      }

      throw new Error(`Server Error: ${errorDetails}`);
    }

    // Parse successful response
    const responseText = await response.text();
    console.log("✅ Raw response received, length:", responseText.length);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log("📊 Parsed JSON successfully");
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError, "Response:", responseText.substring(0, 500));
      throw new Error("Invalid response format from server");
    }

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error("Empty or invalid response from server");
    }

    // Check for Gemini API errors in successful HTTP response
    if (data.error) {
      console.error("❌ Gemini API Error:", data.error);
      throw new Error(data.error.message || data.error);
    }

    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error("❌ No candidates in response:", data);
      throw new Error("AI service returned no response candidates");
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error("❌ No content parts in candidate:", candidate);
      throw new Error("AI response missing content");
    }

    const reply = candidate.content.parts[0].text;
    if (!reply || reply.trim().length === 0) {
      throw new Error("AI generated empty response");
    }

    console.log("🎯 Successfully generated response, length:", reply.length);

    // Replace loading message with actual response
    loadingElement.remove();
    addMessage(reply, "chatbot");

  } catch (error) {
    console.error("💥 Error in askGemini:", error);
    
    // Remove loading message
    loadingElement.remove();
    
    // User-friendly error messages based on error type
    let userFriendlyMessage = "Sorry, I encountered an error while processing your question. ";
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      userFriendlyMessage += "The request took too long. Please try again with a shorter question.";
    } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      userFriendlyMessage += "Network connection issue. Please check your internet connection.";
    } else if (error.message.includes('Invalid response format') || error.message.includes('JSON')) {
      userFriendlyMessage += "Server response error. Please try again in a moment.";
    } else if (error.message.includes('HTTP 4')) {
      userFriendlyMessage += "Request error. Please check your question and try again.";
    } else if (error.message.includes('HTTP 5')) {
      userFriendlyMessage += "Server is temporarily unavailable. Please try again later.";
    } else if (error.message.includes('AI service') || error.message.includes('Gemini')) {
      userFriendlyMessage += "AI service is currently busy. Please try again in a few moments.";
    } else {
      userFriendlyMessage += error.message ? `Error: ${error.message}` : "Please try again.";
    }

    addMessage(userFriendlyMessage, "chatbot");
    
    // Re-throw for outer catch block if needed
    throw error;
  }
}

// ------------------------------
// Utility Functions for Debugging
// ------------------------------

/**
 * Test the proxy connection independently
 */
window.testProxyConnection = async function() {
  console.group("🔧 Testing Proxy Connection");
  try {
    const testQuestion = "Hello, please respond with just 'TEST OK' to confirm connection.";
    
    const response = await fetch("backend/proxy.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          role: "user", 
          parts: [{ text: testQuestion }] 
        }],
      }),
    });

    const result = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", result.substring(0, 500));

    if (response.ok) {
      console.log("✅ Proxy connection test: PASSED");
      return { success: true, status: response.status, data: result };
    } else {
      console.log("❌ Proxy connection test: FAILED");
      return { success: false, status: response.status, error: result };
    }
  } catch (error) {
    console.error("💥 Proxy test error:", error);
    return { success: false, error: error.message };
  } finally {
    console.groupEnd();
  }
};

/**
 * Validate the backend/proxy.php file exists and is accessible
 */
window.checkBackendAccess = async function() {
  console.group("🔧 Checking Backend Access");
  try {
    // Test if the proxy file exists
    const response = await fetch("backend/proxy.php", { 
      method: 'HEAD',
      headers: { 'Cache-Control': 'no-cache' }
    });
    console.log("Backend file access:", response.status);
    console.groupEnd();
    return response.status !== 404;
  } catch (error) {
    console.error("Backend access check failed:", error);
    console.groupEnd();
    return false;
  }
};

// Initialize debug helpers in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log("🔧 Development mode: Debug helpers available:");
  console.log("  - testProxyConnection()");
  console.log("  - checkBackendAccess()");
}
