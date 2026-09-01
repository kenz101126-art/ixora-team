let token = localStorage.getItem("ixora_admin_token");

function escapeHTML(value) {
  const d = document.createElement("div"); d.textContent = value; return d.innerHTML;
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

function showDashboard() {
  document.getElementById("loginScreen").hidden = true;
  document.getElementById("dashboard").hidden = false;
  loadAdminData();
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.getElementById("loginStatus");
  status.textContent = "Logging in...";

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    token = data.token;
    localStorage.setItem("ixora_admin_token", token);
    showDashboard();
  } catch (error) {
    status.textContent = error.message || "Login failed.";
  }
});

async function loadAdminData() {
  try {
    const [appsRes, messagesRes] = await Promise.all([
      fetch("/api/admin/applications", {headers: authHeaders()}),
      fetch("/api/admin/messages", {headers: authHeaders()})
    ]);

    if (appsRes.status === 401 || messagesRes.status === 401) {
      localStorage.removeItem("ixora_admin_token");
      token = null;
      location.reload();
      return;
    }

    const applications = await appsRes.json();
    const messages = await messagesRes.json();

    document.getElementById("totalApplications").textContent = applications.length;
    document.getElementById("totalMessages").textContent = messages.length;

    document.getElementById("applicationsTable").innerHTML = applications.length ?
      applications.map(app => `<tr>
        <td>${escapeHTML(app.name)}</td><td>${app.age}</td>
        <td>${app.status}</td><td>${new Date(app.createdAt).toLocaleString()}</td>
        <td>
          <button class="action approve" onclick="changeStatus('${app._id}','Approved')">APPROVE</button>
          <button class="action reject" onclick="changeStatus('${app._id}','Rejected')">REJECT</button>
          <button class="action delete" onclick="deleteApplication('${app._id}')">DELETE</button>
        </td>
      </tr>`).join("") : '<tr><td colspan="5">No applications yet.</td></tr>';

    document.getElementById("adminMessages").innerHTML = messages.length ?
      messages.map(m => `<div class="admin-message">
        <strong>${escapeHTML(m.name)}</strong>
        <small> • ${new Date(m.createdAt).toLocaleString()}</small>
        <p>${escapeHTML(m.message)}</p>
        <button class="action delete" onclick="deleteMessage('${m._id}')">DELETE</button>
      </div>`).join("") : "<p>No messages yet.</p>";
  } catch {
    document.getElementById("applicationsTable").innerHTML =
      '<tr><td colspan="5">Unable to load dashboard data.</td></tr>';
  }
}

async function changeStatus(id, status) {
  await fetch(`/api/admin/applications/${id}`, {
    method:"PATCH", headers:authHeaders(), body:JSON.stringify({status})
  });
  loadAdminData();
}

async function deleteApplication(id) {
  if (!confirm("Delete this application?")) return;
  await fetch(`/api/admin/applications/${id}`, {
    method:"DELETE", headers:authHeaders()
  });
  loadAdminData();
}

async function deleteMessage(id) {
  if (!confirm("Delete this message?")) return;
  await fetch(`/api/admin/messages/${id}`, {
    method:"DELETE", headers:authHeaders()
  });
  loadAdminData();
}

document.getElementById("refreshButton").onclick = loadAdminData;
document.getElementById("logoutButton").onclick = () => {
  localStorage.removeItem("ixora_admin_token");
  location.reload();
};

if (token) showDashboard();
