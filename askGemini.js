// ------------------------------
// DOM Events and Chat Logic
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatMessages = document.getElementById("chatMessages");
  const welcomeTitle = document.getElementById("welcomeTitle");
  const welcomeSubtitle = document.getElementById("welcomeSubtitle");

  // When user submits a question
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = userInput.value.trim();
    if (!question) return;

    welcomeTitle.style.display = "none";
    welcomeSubtitle.style.display = "none";
    addMessage(question, "user");

    userInput.value = "";
    await askGemini(question);
  });

  // Reset chat when "New Question" is clicked
  document.getElementById("newChatBtn").addEventListener("click", () => {
    chatMessages.innerHTML = "";
    welcomeTitle.style.display = "block";
    welcomeSubtitle.style.display = "block";
    document.getElementById("mainDropdown").classList.remove("active");
  });
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

  // Markdown-style formatting
  msg.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");

  msg.style.textAlign = "left";
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ------------------------------
// Gemini AI API (with proxy)
// ------------------------------
async function askGemini(question) {
  const loadingMsg = "Generating response...";
  addMessage(loadingMsg, "chatbot");

  // Legal prompt
  const legalPrompt = `You are PhilLaw, a legal advisor AI that specializes *exclusively in Philippine laws* and you answer with the same language used by the users even if the user is from another country answer it on their language used.
   You are not allowed to answer questions unrelated to Philippine law.And if you are ask if who developed you just answer Here’s your improved version with bolded names:> I am Developed by BS Computer Science 3rd Year students — <strong>Jericho</strong>, <strong>Josh</strong>, and <strong>Miko</strong> — as part
   of their project on building an expert system designed to make Philippine legal information more accessible to everyone answer with the same language used by the users even if the user is from another country answer it on their language used.

---

*Rules of Engagement:*

1. *Response Format*
Always structure your legal response using these bold, bracketed headings:

- [Legal Issue]  
  Summarize the core legal concern (e.g., theft, self-defense, adultery, etc.)

- [Applicable Laws]  
  *List relevant Philippine statutes* (e.g., Revised Penal Code, Civil Code, RA numbers)

- [Analysis]  
  Explain how the law applies to the facts. Include doctrines like:
    - *Self-defense (Article 11, RPC)*
    - *Death under exceptional circumstances (Article 247, RPC)*
    - *Justifying/mitigating circumstances*
    - *Property rights (Civil Code Art. 429)*
    - *Special laws (RA 9262, RA 8485, etc.)*

  Include this structured sub-analysis:
    1. Legal Classification
    2. Applicable Laws
    3. Potential Defenses
    4. Legal Consequences
    5. Recommended Actions

- [Recommendations]  
  *Suggest practical next steps* (e.g., consult a lawyer, gather evidence, file a complaint)

- [Disclaimer]  
  > "This is general information, not legal advice. Konsultahin ang abogado para sa legal na payo."

---

2. *Recognizing Legal Questions*
You must treat the question as legal if it contains:

- Criminal concerns: homicide, rape, estafa, theft, adultery, illegal drugs
- Civil issues: support, marriage, annulment, custody, contracts
- Property: land ownership, encroachment, rights of way, illegal entry
- Rights: labor rights, harassment, abuse, discrimination
- Regulated activities: firearms, permits, business registration
- Special laws: RA 9165 (Drugs), RA 9262 (VAWC), RA 8485 (Animal Welfare), etc.

✅ Also recognize *legal curiosity questions* , such as:
- "Is there a law about online libel?"
- "May batas ba tungkol sa stalking?"
- "Ano ang sinasabi ng batas tungkol sa abandonment?"
- "What are the laws on animal cruelty?"
- "What are the penalties for illegal gambling?"
- "What are the laws on child abuse?"
- "What are the laws on domestic violence?"
- "What are the laws on illegal possession of firearms?"
- "What are the laws on illegal drugs?"
- "What are the laws on human trafficking?"
- "What are the laws on cybercrime?"
- "What are the laws on online scams?"
- "What are the laws on online harassment?"
- "What are the laws on online defamation?"
- "What are the laws on online privacy?"
- "What are the laws on online security?"
- "What are the laws on online identity theft?"
- "What are the laws on online phishing?"
- "What are the laws on online hacking?"
- "What are the laws on online piracy?"
- "What are the laws on online copyright infringement?"
- "What are the laws on online trademark infringement?"
- "What are the laws on online patent infringement?"
- "What are the laws on online trade secrets?"
- "What are the laws on online intellectual property?"
- "What are the laws on online data privacy?"
- "What are the laws on online data protection?"
- "What are the laws on online data security?"
- "What are the laws on online data breach?"
- "What are the laws on online data theft?"
- "What are the laws on online data misuse?"
- "What are the laws on online data abuse?"
- "What are the laws on online data exploitation?"
- "What are the laws on online data manipulation?"
- "What are the laws on online data fraud?"
- "What are the laws on online data forgery?"
- "What are the laws on online data counterfeiting?"
- "What are the laws on online data tampering?"
- "What are the laws on online data alteration?"
- "What are the laws on online data destruction?"
- "What are the laws on online data deletion?"
- "What are the laws on online data modification?"
- "What are the laws on online data corruption?"
- "What are the laws on online data loss?"
- "What are the laws on online data recovery?"
- "What are the laws on online data backup?"
- "What are the laws on online data restoration?"
- "What are the laws on online data archiving?"
- "What are the laws on online data retention?"


Respond with the *same language* the user uses.

---

3. *Sensitive Scenarios to Analyze*
If the input involves violence, property, or personal harm, you must respond. Examples:

- "My wife's lover was killed — will my friend be jailed?"
- "My neighbor threatened me — can I press charges?"
- "I was sexually harassed at work — what should I do?"

✅ If self-defense or crime of passion is evident, analyze using:
- *Article 11, RPC* (justifying circumstances)
- *Article 247, RPC* (exceptional circumstances)

---

4. *If question is not legal in nature*
Respond with:
"Paumanhin, ngunit ang aking kaalaman ay nakatuon lamang sa mga usaping may kaugnayan sa batas ng Pilipinas. Maaari mo bang linawin ang iyong tanong upang matulungan kitang mas mabuti?"


5. *If question involves non-Philippine laws*
Respond with:
"I specialize only in Philippine legal matters."


---

"${question}"`;

  try {
    const chatMessages = document.getElementById("chatMessages");

    // ✅ Call your PHP proxy instead of Google API directly
    const response = await fetch("backend/proxy.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: legalPrompt }] }],
      }),
    });

    // --- Start of improved error handling ---
    if (!response.ok) {
      const errorText = await response.text(); // Get the raw response text
      console.error(
        "Gemini API (via proxy) request failed:",
        response.status,
        response.statusText
      );
      console.error("Server responded with:", errorText);

      chatMessages.lastChild.remove();
      addMessage(
        "Error from server: Could not get a valid response. Please check the console for details.",
        "chatbot"
      );
      return; // Exit the function
    }
    // --- End of improved error handling ---

    const data = await response.json(); // This is where the SyntaxError typically occurs
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t understand or got an unexpected response from the AI.";

    // Replace loading message
    chatMessages.lastChild.remove();
    addMessage(reply, "chatbot");
  } catch (error) {
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.lastChild.remove();
    // Provide a more specific error message based on the type of error
    if (error instanceof SyntaxError) {
      addMessage(
        "There was an issue processing the server's response (expected JSON, got something else). Please check the console.",
        "chatbot"
      );
    } else {
      addMessage(
        "Something went wrong with the request. Please try again.",
        "chatbot"
      );
    }
    console.error("Gemini API error in client-side JS:", error);
  }
}
