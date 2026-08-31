// Global Application State
const state = {
  user: null,
  activeBuild: null,
  history: [],
  ideas: []
};

document.addEventListener("DOMContentLoaded", () => {
  initPillGroups();
  loadSession();
  setupNavigation();
  setupAuth();
  setupFormEngine();
  setupIdeasEngine();
  renderApp();
});

// --- PILL SELECTOR INTERACTION ---
function initPillGroups() {
  document.querySelectorAll(".pill-group").forEach(group => {
    const isSingle = group.getAttribute("data-single") === "true";
    group.querySelectorAll(".pill").forEach(pill => {
      pill.addEventListener("click", () => {
        if (isSingle) {
          group.querySelectorAll(".pill").forEach(p => p.classList.remove("active", "active-orange"));
          if (group.id === "pill-challenge") {
            pill.classList.add("active-orange");
          } else {
            pill.classList.add("active");
          }
        } else {
          pill.classList.toggle("active");
        }
      });
    });
  });
}

// --- AUTH & SESSION STORAGE ---
function loadSession() {
  const savedUser = localStorage.getItem("kiln_session_user");
  if (savedUser) {
    state.user = savedUser;
    loadUserData(savedUser);
  }
}

function loadUserData(username) {
  const data = localStorage.getItem(`kiln_data_${username}`);
  if (data) {
    const parsed = JSON.parse(data);
    state.activeBuild = parsed.activeBuild || null;
    state.history = parsed.history || [];
    state.ideas = parsed.ideas || [];
  }
}

function saveUserData() {
  if (!state.user) return;
  const payload = {
    activeBuild: state.activeBuild,
    history: state.history,
    ideas: state.ideas
  };
  localStorage.setItem(`kiln_data_${state.user}`, JSON.stringify(payload));
}

function setupAuth() {
  // Signup
  document.getElementById("signup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("signup-user").value.trim();
    if (!username) return;

    state.user = username;
    localStorage.setItem("kiln_session_user", username);
    saveUserData();
    navigateTo("screen-home");
  });

  // Login
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-user").value.trim();
    if (!username) return;

    state.user = username;
    localStorage.setItem("kiln_session_user", username);
    loadUserData(username);
    navigateTo("screen-home");
  });

  // Logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    state.user = null;
    localStorage.removeItem("kiln_session_user");
    navigateTo("screen-landing");
  });
}

// --- NAVIGATION ---
function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget.getAttribute("data-target");
      navigateTo(target);
    });
  });
}

function navigateTo(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) targetScreen.classList.add("active");

  const matchingNav = document.querySelector(`.nav-btn[data-target="${screenId}"]`);
  if (matchingNav) matchingNav.classList.add("active");

  // Show/Hide top header based on session
  const header = document.getElementById("app-header");
  if (screenId === "screen-landing" || screenId === "screen-signup" || screenId === "screen-login") {
    header.classList.add("hidden");
  } else {
    header.classList.remove("hidden");
    document.getElementById("nav-username").textContent = state.user || "vermin";
  }

  renderApp();
}

// --- BUILD PROFILE & LOCAL GENERATOR ---
function setupFormEngine() {
  document.getElementById("build-profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-ignite");
    btn.textContent = "🔥 Igniting the Machine...";
    btn.disabled = true;

    const getSelectedPills = (id) => Array.from(document.querySelectorAll(`#${id} .pill.active, #${id} .pill.active-orange`)).map(p => p.textContent);

    const constraints = {
      skills: document.getElementById("input-existing-skills").value,
      exp: getSelectedPills("pill-exp")[0] || "Intermediate",
      time: getSelectedPills("pill-time")[0] || "5-15 hrs",
      goals: getSelectedPills("pill-goals"),
      type: getSelectedPills("pill-type"),
      practice: document.getElementById("input-practice-tech").value,
      avoid: document.getElementById("input-avoid").value,
      interests: document.getElementById("input-interests").value,
      challenge: getSelectedPills("pill-challenge")[0] || "Normal"
    };

    // Simulate local recommendation processing delay
    setTimeout(() => {
      const recommendation = generateLocalRecommendation(constraints);
      state.activeBuild = {
        ...recommendation,
        status: "in-progress",
        startedAt: new Date().toLocaleDateString("en-GB")
      };
      saveUserData();
      
      btn.textContent = "🔥 Ignite the Machine ➔";
      btn.disabled = false;
      navigateTo("screen-workspace");
    }, 600);
  });

  // Workspace actions
  document.getElementById("btn-abandon-build").addEventListener("click", () => {
    if (!state.activeBuild) return;
    state.activeBuild.status = "abandoned";
    state.history.push(state.activeBuild);
    state.activeBuild = null;
    saveUserData();
    navigateTo("screen-history");
  });

  document.getElementById("btn-query-ai").addEventListener("click", handleStuckQuery);
}

// Zero-cost local project generator
function generateLocalRecommendation(c) {
  const primarySkill = c.skills ? c.skills.split(',')[0].trim() : 'Web Development';
  const practiceTech = c.practice ? c.practice.split(',')[0].trim() : primarySkill;
  const projectType = c.type[0] || 'Web app';
  const focusGoal = c.goals[0] || 'Learning';

  const projectTemplates = [
    {
      title: `${primarySkill} Focus Dashboard`,
      tagline: `A lean, distraction-free ${projectType.toLowerCase()} built to practice ${practiceTech} while focusing on ${focusGoal.toLowerCase()}.`,
      tasks: [
        { id: 1, text: `Initialize local project structure and design initial wireframes`, completed: false },
        { id: 2, text: `Set up state management and baseline logic with ${practiceTech}`, completed: false },
        { id: 3, text: `Implement core MVP workflow and user input controls`, completed: false },
        { id: 4, text: `Refine UI polish, handle edge cases, and finalize build`, completed: false }
      ]
    },
    {
      title: `Minimalist ${practiceTech} Automation Hub`,
      tagline: `A lightweight ${projectType.toLowerCase()} designed to streamline small daily workflows and build production confidence.`,
      tasks: [
        { id: 1, text: `Set up module structure and core data schema`, completed: false },
        { id: 2, text: `Build core action handlers utilizing ${practiceTech}`, completed: false },
        { id: 3, text: `Add local storage capabilities and error logging`, completed: false },
        { id: 4, text: `Optimize performance and polish visual states`, completed: false }
      ]
    },
    {
      title: `Personal ${primarySkill} Workflow Engine`,
      tagline: `A hyper-focused ${projectType.toLowerCase()} designed to help solve real project management friction points locally.`,
      tasks: [
        { id: 1, text: `Draft component hierarchy and setup dark-mode layout`, completed: false },
        { id: 2, text: `Integrate core CRUD operations using ${primarySkill}`, completed: false },
        { id: 3, text: `Implement search, filtering, and export controls`, completed: false },
        { id: 4, text: `Final test pass and complete launch checklist`, completed: false }
      ]
    }
  ];

  return projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
}

// Zero-cost local troubleshooter
function handleStuckQuery() {
  const task = document.getElementById("stuck-task-select").value;
  const issue = document.getElementById("stuck-issue-select").value;
  const output = document.getElementById("ai-advice-result");

  if (!task) return;

  output.classList.remove("hidden");
  output.textContent = "Analyzing task bottleneck...";

  setTimeout(() => {
    output.innerHTML = `
      <strong>Local Advisor Guidance (${issue}):</strong><br>
      1. Break "${task}" into 2 smaller, isolated functions.<br>
      2. Verify data inputs using <code>console.log()</code> before styling or refactoring.<br>
      3. Build the absolute simplest working version first, then layer on complexity.
    `;
  }, 400);
}

// --- IDEAS INBOX ENGINE ---
function setupIdeasEngine() {
  document.getElementById("btn-save-idea").addEventListener("click", () => {
    const input = document.getElementById("input-new-idea");
    const val = input.value.trim();
    if (!val) return;

    state.ideas.push({ id: Date.now(), text: val });
    input.value = "";
    saveUserData();
    renderIdeas();
    renderHomeStats();
  });
}

// --- UI RENDERING ---
function renderApp() {
  renderHomeStats();
  renderHistory();
  renderIdeas();
  renderProfile();
  renderWorkspace();
}

function renderHomeStats() {
  const finished = state.history.filter(h => h.status === "completed").length;
  const abandoned = state.history.filter(h => h.status === "abandoned").length;

  document.getElementById("stat-finished").textContent = finished;
  document.getElementById("stat-graveyard").textContent = abandoned;
  document.getElementById("stat-ideas").textContent = state.ideas.length;
}

function renderHistory() {
  const container = document.getElementById("history-list");
  const subtitle = document.getElementById("history-subtitle");

  if (state.history.length === 0) {
    subtitle.textContent = "Nothing archived yet. Finish, deploy, or abandon a build and it'll show up here.";
    container.innerHTML = "";
    return;
  }

  subtitle.textContent = "Tracked history of your previous builds.";
  container.innerHTML = state.history.map(item => `
    <div class="mini-card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="card-title">${item.title}</span>
        <span class="sub-label" style="color:${item.status === 'completed' ? '#10b981' : '#ef4444'}">${item.status.toUpperCase()}</span>
      </div>
      <div class="card-desc mt-2">${item.tagline}</div>
    </div>
  `).join("");
}

function renderIdeas() {
  const container = document.getElementById("ideas-list-container");
  if (state.ideas.length === 0) {
    container.innerHTML = `<p class="muted-label">No ideas saved yet.</p>`;
    return;
  }

  container.innerHTML = state.ideas.map(i => `
    <div class="task-row mb-2">
      <span style="flex:1;">💡 ${i.text}</span>
      <button class="btn btn-dark" style="padding:0.2rem 0.5rem; font-size:0.75rem" onclick="deleteIdea(${i.id})">Delete</button>
    </div>
  `).join("");
}

function deleteIdea(id) {
  state.ideas = state.ideas.filter(i => i.id !== id);
  saveUserData();
  renderIdeas();
  renderHomeStats();
}

function renderProfile() {
  if (state.user) {
    document.getElementById("profile-user-display").textContent = state.user;
    document.getElementById("nav-username").textContent = state.user;
  }

  const finished = state.history.filter(h => h.status === "completed");
  document.getElementById("prof-stat-shipped").textContent = finished.length;
  document.getElementById("prof-stat-started").textContent = state.history.length + (state.activeBuild ? 1 : 0);

  const resumeBox = document.getElementById("resume-export-box");
  if (finished.length === 0) {
    resumeBox.textContent = "No completed builds recorded yet.";
  } else {
    resumeBox.textContent = finished.map(f => `• ${f.title}: ${f.tagline}`).join("\n");
  }
}

function renderWorkspace() {
  const title = document.getElementById("ws-title");
  const tagline = document.getElementById("ws-tagline");
  const tasksContainer = document.getElementById("ws-tasks-container");
  const select = document.getElementById("stuck-task-select");

  if (!state.activeBuild) {
    title.textContent = "No Active Build";
    tagline.textContent = "Ignite the Machine from the Home screen or Build Profile to start.";
    tasksContainer.innerHTML = `<p class="muted-label">No active roadmap tasks.</p>`;
    select.innerHTML = "";
    return;
  }

  title.textContent = state.activeBuild.title;
  tagline.textContent = state.activeBuild.tagline;

  tasksContainer.innerHTML = state.activeBuild.tasks.map(t => `
    <div class="task-row ${t.completed ? 'done' : ''}">
      <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
      <span>${t.text}</span>
    </div>
  `).join("");

  select.innerHTML = state.activeBuild.tasks.map(t => `
    <option value="${t.text}">${t.text}</option>
  `).join("");
}

function toggleTask(id) {
  if (!state.activeBuild) return;
  const task = state.activeBuild.tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;

  const allDone = state.activeBuild.tasks.every(t => t.completed);
  if (allDone) {
    alert("🎉 Project Completed! Added to your Shipped portfolio history.");
    state.activeBuild.status = "completed";
    state.history.push(state.activeBuild);
    state.activeBuild = null;
  }

  saveUserData();
  renderApp();
}