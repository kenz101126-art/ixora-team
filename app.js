const form = document.getElementById("registrationForm");
const formStatus = document.getElementById("formStatus");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "Sending application...";

  try {
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.getElementById("name").value.trim(),
        age: Number(document.getElementById("age").value)
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    formStatus.textContent = "✓ Successfully sent to IXORA TEAM Admin!";
    form.reset();
  } catch (error) {
    formStatus.textContent = error.message || "Unable to submit application.";
  }
});

const messages = document.getElementById("messages");
function escapeHTML(value) {
  const d = document.createElement("div"); d.textContent = value; return d.innerHTML;
}

async function loadMessages() {
  try {
    const response = await fetch("/api/messages");
    const data = await response.json();
    messages.innerHTML = data.map(m => `
      <div class="message">
        <strong>${escapeHTML(m.name)}</strong>
        <small> • ${new Date(m.createdAt).toLocaleString()}</small>
        <p>${escapeHTML(m.message)}</p>
      </div>`).join("");
    messages.scrollTop = messages.scrollHeight;
  } catch {
    messages.innerHTML = '<div class="message">Unable to connect to chat.</div>';
  }
}

document.getElementById("chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("chatName").value.trim();
  const message = document.getElementById("chatMessage").value.trim();

  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({name, message})
    });
    if (!response.ok) throw new Error();
    document.getElementById("chatMessage").value = "";
    loadMessages();
  } catch {
    alert("Unable to send message.");
  }
});

loadMessages();
setInterval(loadMessages, 5000);
