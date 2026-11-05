const clientList = document.querySelector("#client-list");
const clientForm = document.querySelector("#client-form");
const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const feedback = document.querySelector("#feedback");
const emptyState = document.querySelector("#empty-state");
const noResults = document.querySelector("#no-results");
const formTitle = document.querySelector("#form-title");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit");

const statusLabels = {
  client: "Client",
  prospect: "Prospect",
  inactif: "Inactif"
};

let clients = [];
let editingId = null;

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Une erreur est survenue. Veuillez réessayer.");
  }
  return data;
}

function showFeedback(message, type = "success") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
  feedback.hidden = false;
}

function hideFeedback() {
  feedback.hidden = true;
  feedback.textContent = "";
}

function makeCell(className, text) {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function createClientRow(client) {
  const row = document.createElement("tr");
  const contactCell = document.createElement("td");
  contactCell.className = "contact-cell";

  const avatar = document.createElement("span");
  avatar.className = "contact-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = (client.nom || "?").trim().charAt(0).toLocaleUpperCase("fr");

  const contactDetails = document.createElement("span");
  contactDetails.className = "contact-details";
  const name = document.createElement("strong");
  name.textContent = client.nom;
  const email = document.createElement("span");
  email.textContent = client.email;
  contactDetails.append(name, email);
  contactCell.append(avatar, contactDetails);
  row.append(contactCell);
  row.append(makeCell("", client.entreprise || "—"));
  row.append(makeCell("", client.telephone || "—"));

  const statusCell = document.createElement("td");
  const status = document.createElement("span");
  status.className = `status-badge status-${client.statut}`;
  status.textContent = statusLabels[client.statut] || "Prospect";
  statusCell.append(status);
  row.append(statusCell);

  const actionsCell = document.createElement("td");
  actionsCell.className = "actions-cell";
  const actions = document.createElement("div");
  actions.className = "row-actions";
  actions.setAttribute("aria-label", `Actions pour ${client.nom}`);

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "icon-button";
  editButton.dataset.action = "edit";
  editButton.dataset.id = client._id;
  editButton.setAttribute("aria-label", `Modifier ${client.nom}`);
  editButton.title = "Modifier";
  editButton.textContent = "✎";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "icon-button delete-button";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.id = client._id;
  deleteButton.setAttribute("aria-label", `Supprimer ${client.nom}`);
  deleteButton.title = "Supprimer";
  deleteButton.textContent = "×";

  actions.append(editButton, deleteButton);
  actionsCell.append(actions);
  row.append(actionsCell);
  return row;
}

function renderClients() {
  const search = searchInput.value.trim().toLocaleLowerCase("fr");
  const selectedStatus = statusFilter.value;
  const filteredClients = clients.filter((client) => {
    const matchesSearch = [client.nom, client.email, client.entreprise, client.telephone]
      .some((value) => (value || "").toLocaleLowerCase("fr").includes(search));
    return matchesSearch && (selectedStatus === "tous" || client.statut === selectedStatus);
  });

  clientList.replaceChildren(...filteredClients.map(createClientRow));
  document.querySelector("#visible-count").textContent =
    `${filteredClients.length} contact${filteredClients.length > 1 ? "s" : ""}`;
  document.querySelector("#total-count").textContent = clients.length;
  document.querySelector("#active-count").textContent =
    clients.filter((client) => client.statut === "client").length;
  document.querySelector("#prospect-count").textContent =
    clients.filter((client) => client.statut === "prospect").length;

  emptyState.hidden = clients.length > 0;
  noResults.hidden = clients.length === 0 || filteredClients.length > 0;
  document.querySelector(".table-wrap").classList.toggle("is-empty", filteredClients.length === 0);
}

async function loadClients() {
  try {
    clients = await request("/api/clients");
    renderClients();
    return true;
  } catch (error) {
    showFeedback(error.message, "error");
    return false;
  }
}

function resetForm() {
  editingId = null;
  clientForm.reset();
  document.querySelector("#statut").value = "prospect";
  formTitle.textContent = "Ajouter un client";
  submitButton.textContent = "Ajouter le contact";
  cancelEditButton.hidden = true;
}

function startEditing(client) {
  editingId = client._id;
  for (const field of ["nom", "email", "entreprise", "telephone", "statut"]) {
    clientForm.elements[field].value = client[field] || (field === "statut" ? "prospect" : "");
  }
  formTitle.textContent = "Modifier le client";
  submitButton.textContent = "Enregistrer les modifications";
  cancelEditButton.hidden = false;
  document.querySelector("#nom").focus();
  hideFeedback();
}

clientForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideFeedback();
  submitButton.disabled = true;

  const clientData = Object.fromEntries(new FormData(clientForm).entries());
  const wasEditing = Boolean(editingId);
  const path = wasEditing ? `/api/clients/${encodeURIComponent(editingId)}` : "/api/clients";

  try {
    await request(path, {
      method: wasEditing ? "PATCH" : "POST",
      body: JSON.stringify(clientData)
    });
    resetForm();
    if (await loadClients()) {
      showFeedback(wasEditing ? "Les modifications ont été enregistrées." : "Le client a bien été ajouté.");
    }
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
});

clientList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const client = clients.find((item) => item._id === button.dataset.id);
  if (!client) return;

  if (button.dataset.action === "edit") {
    startEditing(client);
    return;
  }

  if (button.dataset.action === "delete") {
    if (!window.confirm(`Supprimer le contact « ${client.nom} » ?`)) return;
    hideFeedback();
    button.disabled = true;
    try {
      await request(`/api/clients/${encodeURIComponent(client._id)}`, { method: "DELETE" });
      if (editingId === client._id) resetForm();
      if (await loadClients()) showFeedback("Le client a bien été supprimé.");
    } catch (error) {
      showFeedback(error.message, "error");
      button.disabled = false;
    }
  }
});

searchInput.addEventListener("input", renderClients);
statusFilter.addEventListener("change", renderClients);
cancelEditButton.addEventListener("click", resetForm);

loadClients();