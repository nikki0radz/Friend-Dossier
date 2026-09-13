const STORAGE_KEY = "friendDossier.v2";
const LEGACY_STORAGE_KEY = "peopleNotes.v1";

const state = {
  friends: [],
  selectedId: null,
};

const $ = (id) => document.getElementById(id);

const refs = {
  loadingScreen: $("loadingScreen"),
  loadingBarFill: $("loadingBarFill"),
  appRoot: $("appRoot"),
  homeView: $("homeView"),
  profileView: $("profileView"),
  bubbleGrid: $("bubbleGrid"),
  searchInput: $("searchInput"),
  backBtn: $("backBtn"),
  exportBtn: $("exportBtn"),
  importInput: $("importInput"),
  profileImage: $("profileImage"),
  profileAvatar: $("profileAvatar"),
  profileName: $("profileName"),
  profileSubtitle: $("profileSubtitle"),
  datesDisplay: $("datesDisplay"),
  allergiesDisplay: $("allergiesDisplay"),
  likesDisplay: $("likesDisplay"),
  giftsDisplay: $("giftsDisplay"),
  notesDisplay: $("notesDisplay"),
  customDisplay: $("customDisplay"),
  editBtn: $("editBtn"),
  deleteBtn: $("deleteBtn"),
  friendDialog: $("friendDialog"),
  friendForm: $("friendForm"),
  dialogTitle: $("dialogTitle"),
  friendId: $("friendId"),
  currentImageData: $("currentImageData"),
  photoInput: $("photoInput"),
  photoPreview: $("photoPreview"),
  photoFallback: $("photoFallback"),
  removePhotoBtn: $("removePhotoBtn"),
  nameInput: $("nameInput"),
  relationshipInput: $("relationshipInput"),
  birthdayInput: $("birthdayInput"),
  otherDateInput: $("otherDateInput"),
  otherDateLabelInput: $("otherDateLabelInput"),
  allergiesInput: $("allergiesInput"),
  likesInput: $("likesInput"),
  giftsInput: $("giftsInput"),
  notesInput: $("notesInput"),
  customFields: $("customFields"),
  addCustomFieldBtn: $("addCustomFieldBtn"),
  closeDialogBtn: $("closeDialogBtn"),
  cancelBtn: $("cancelBtn"),
  toast: $("toast"),
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) state.friends = parsed;
    if (state.friends.length) state.selectedId = state.friends[0].id;
  } catch (error) {
    console.warn("Could not load saved data.", error);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.friends));
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "?";
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function splitCommaValues(value) {
  return value.split(",").map(x => x.trim()).filter(Boolean);
}

function splitLines(value) {
  return value.split("\n").map(x => x.trim()).filter(Boolean);
}

function showToast(message) {
  refs.toast.textContent = message;
  refs.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => refs.toast.classList.remove("show"), 1800);
}

function emptyValue(text) {
  return `<span class="empty-value">${escapeHtml(text)}</span>`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSelectedFriend() {
  return state.friends.find(friend => friend.id === state.selectedId) || null;
}

function openHome() {
  refs.homeView.classList.remove("hidden");
  refs.profileView.classList.add("hidden");
}

function openProfile(id) {
  state.selectedId = id;
  refs.homeView.classList.add("hidden");
  refs.profileView.classList.remove("hidden");
  renderProfile();
}

function renderHome() {
  const query = refs.searchInput.value.trim().toLowerCase();
  refs.bubbleGrid.innerHTML = "";

  const addBubble = document.createElement("button");
  addBubble.className = "bubble add-bubble";
  addBubble.innerHTML = `
    <div class="plus-badge">+</div>
    <div class="bubble-name">Add person</div>
    <div class="bubble-sub">Create a new dossier</div>
  `;
  addBubble.addEventListener("click", openAddDialog);
  refs.bubbleGrid.appendChild(addBubble);

  const filtered = state.friends
    .filter(friend => {
      const haystack = [friend.name, friend.relationship, ...(friend.likes || []), friend.notes].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  filtered.forEach(friend => {
    const bubble = document.createElement("button");
    bubble.className = "bubble";

    const avatarOrImage = friend.imageData
      ? `<div class="bubble-avatar"><img src="${friend.imageData}" alt="${escapeHtml(friend.name)}" /></div>`
      : `<div class="bubble-avatar">${escapeHtml(initials(friend.name))}</div>`;

    bubble.innerHTML = `
      ${avatarOrImage}
      <div class="bubble-name">${escapeHtml(friend.name)}</div>
      <div class="bubble-sub">${escapeHtml(friend.relationship || "No label yet")}</div>
    `;
    bubble.addEventListener("click", () => openProfile(friend.id));
    refs.bubbleGrid.appendChild(bubble);
  });

  if (!filtered.length && state.friends.length) {
    const empty = document.createElement("div");
    empty.className = "empty-value";
    empty.style.gridColumn = "1 / -1";
    empty.style.textAlign = "center";
    empty.style.padding = "18px";
    empty.textContent = "No people match that search.";
    refs.bubbleGrid.appendChild(empty);
  }
}

function renderTags(container, values, emptyText, accent = false) {
  container.innerHTML = "";
  if (!values?.length) {
    container.innerHTML = emptyValue(emptyText);
    return;
  }
  values.forEach(value => {
    const tag = document.createElement("span");
    tag.className = `tag ${accent ? "accent" : ""}`;
    tag.textContent = value;
    container.appendChild(tag);
  });
}

function renderProfile() {
  const friend = getSelectedFriend();
  if (!friend) {
    openHome();
    return;
  }

  refs.profileName.textContent = friend.name;
  refs.profileSubtitle.textContent = friend.relationship || "No label yet";

  if (friend.imageData) {
    refs.profileImage.src = friend.imageData;
    refs.profileImage.classList.remove("hidden");
    refs.profileAvatar.classList.add("hidden");
  } else {
    refs.profileImage.classList.add("hidden");
    refs.profileAvatar.classList.remove("hidden");
    refs.profileAvatar.textContent = initials(friend.name);
  }

  const dates = [];
  if (friend.birthday) dates.push(`🎂 Birthday · ${formatDate(friend.birthday)}`);
  if (friend.otherDate) dates.push(`${friend.otherDateLabel || "Important date"} · ${formatDate(friend.otherDate)}`);
  renderTags(refs.datesDisplay, dates, "No important dates saved yet.", true);

  refs.allergiesDisplay.innerHTML = friend.allergies ? escapeHtml(friend.allergies).replace(/\n/g, "<br>") : emptyValue("Nothing saved here.");
  renderTags(refs.likesDisplay, friend.likes || [], "No likes saved yet.");

  refs.giftsDisplay.innerHTML = "";
  if (friend.gifts?.length) {
    friend.gifts.forEach(gift => {
      const item = document.createElement("div");
      item.className = "gift-line";
      item.innerHTML = `<span class="gift-dot">✦</span><span>${escapeHtml(gift)}</span>`;
      refs.giftsDisplay.appendChild(item);
    });
  } else {
    refs.giftsDisplay.innerHTML = emptyValue("No gift ideas yet.");
  }

  refs.notesDisplay.innerHTML = friend.notes ? escapeHtml(friend.notes).replace(/\n/g, "<br>") : emptyValue("No notes yet.");

  refs.customDisplay.innerHTML = "";
  if (friend.custom?.length) {
    friend.custom.forEach(item => {
      if (!item.label && !item.value) return;
      const wrapper = document.createElement("dl");
      wrapper.className = "custom-item";
      wrapper.innerHTML = `<dt>${escapeHtml(item.label || "Untitled")}</dt><dd>${escapeHtml(item.value || "—").replace(/\n/g, "<br>")}</dd>`;
      refs.customDisplay.appendChild(wrapper);
    });
  }
  if (!refs.customDisplay.children.length) {
    refs.customDisplay.innerHTML = emptyValue("No extra details yet.");
  }
}

function syncPhotoPreview(imageData = "") {
  refs.currentImageData.value = imageData;
  if (imageData) {
    refs.photoPreview.src = imageData;
    refs.photoPreview.classList.remove("hidden");
    refs.photoFallback.classList.add("hidden");
  } else {
    refs.photoPreview.classList.add("hidden");
    refs.photoFallback.classList.remove("hidden");
  }
}

function openAddDialog() {
  refs.dialogTitle.textContent = "Add person";
  refs.friendForm.reset();
  refs.friendId.value = "";
  refs.customFields.innerHTML = "";
  syncPhotoPreview("");
  addCustomField();
  refs.friendDialog.showModal();
  setTimeout(() => refs.nameInput.focus(), 50);
}

function openEditDialog() {
  const friend = getSelectedFriend();
  if (!friend) return;

  refs.dialogTitle.textContent = "Edit person";
  refs.friendId.value = friend.id;
  refs.nameInput.value = friend.name || "";
  refs.relationshipInput.value = friend.relationship || "";
  refs.birthdayInput.value = friend.birthday || "";
  refs.otherDateInput.value = friend.otherDate || "";
  refs.otherDateLabelInput.value = friend.otherDateLabel || "";
  refs.allergiesInput.value = friend.allergies || "";
  refs.likesInput.value = (friend.likes || []).join(", ");
  refs.giftsInput.value = (friend.gifts || []).join("\n");
  refs.notesInput.value = friend.notes || "";
  refs.customFields.innerHTML = "";
  syncPhotoPreview(friend.imageData || "");

  if (friend.custom?.length) {
    friend.custom.forEach(item => addCustomField(item.label, item.value));
  } else {
    addCustomField();
  }

  refs.friendDialog.showModal();
}

function addCustomField(label = "", value = "") {
  const row = document.createElement("div");
  row.className = "custom-field-row";
  row.innerHTML = `
    <input class="custom-label" maxlength="80" placeholder="Label, e.g. Coffee order" value="${escapeHtml(label)}" />
    <input class="custom-value" maxlength="300" placeholder="Value" value="${escapeHtml(value)}" />
    <button type="button" class="remove-field" aria-label="Remove field">×</button>
  `;
  row.querySelector(".remove-field").addEventListener("click", () => row.remove());
  refs.customFields.appendChild(row);
}

function collectCustomFields() {
  return [...refs.customFields.querySelectorAll(".custom-field-row")]
    .map(row => ({
      label: row.querySelector(".custom-label").value.trim(),
      value: row.querySelector(".custom-value").value.trim(),
    }))
    .filter(item => item.label || item.value);
}

function handleSave(event) {
  event.preventDefault();

  const id = refs.friendId.value || uid();
  const friend = {
    id,
    name: refs.nameInput.value.trim(),
    relationship: refs.relationshipInput.value.trim(),
    birthday: refs.birthdayInput.value,
    otherDate: refs.otherDateInput.value,
    otherDateLabel: refs.otherDateLabelInput.value.trim(),
    allergies: refs.allergiesInput.value.trim(),
    likes: splitCommaValues(refs.likesInput.value),
    gifts: splitLines(refs.giftsInput.value),
    notes: refs.notesInput.value.trim(),
    custom: collectCustomFields(),
    imageData: refs.currentImageData.value || "",
    updatedAt: new Date().toISOString(),
  };

  if (!friend.name) return;

  const existingIndex = state.friends.findIndex(item => item.id === id);
  if (existingIndex >= 0) {
    state.friends[existingIndex] = friend;
    showToast("Person updated");
  } else {
    state.friends.push(friend);
    showToast("Person added");
  }

  state.selectedId = id;
  save();
  refs.friendDialog.close();
  renderHome();
  openProfile(id);
}

function handleDelete() {
  const friend = getSelectedFriend();
  if (!friend) return;
  const ok = confirm(`Delete ${friend.name}? This removes their dossier from this browser.`);
  if (!ok) return;

  state.friends = state.friends.filter(item => item.id !== friend.id);
  state.selectedId = state.friends[0]?.id ?? null;
  save();
  renderHome();
  openHome();
  showToast("Person deleted");
}

function exportBackup() {
  const payload = { version: 2, exportedAt: new Date().toISOString(), friends: state.friends };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `friend-dossier-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("Backup exported");
}

async function importBackup(file) {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const friends = Array.isArray(parsed) ? parsed : parsed.friends;
    if (!Array.isArray(friends)) throw new Error("Invalid backup");

    const ok = confirm(`Import ${friends.length} people? This will replace the current saved data in this browser.`);
    if (!ok) return;

    state.friends = friends;
    state.selectedId = friends[0]?.id ?? null;
    save();
    renderHome();
    openHome();
    showToast("Backup imported");
  } catch (error) {
    alert("That file does not look like a valid Friend Dossier backup.");
  } finally {
    refs.importInput.value = "";
  }
}

function handlePhotoInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => syncPhotoPreview(String(reader.result || ""));
  reader.readAsDataURL(file);
  event.target.value = "";
}

function startLoadingSequence() {
  refs.loadingBarFill.style.width = "100%";
  setTimeout(() => {
    refs.loadingScreen.classList.add("fade-out");
    refs.appRoot.classList.remove("hidden");
  }, 1650);
}

refs.searchInput.addEventListener("input", renderHome);
refs.backBtn.addEventListener("click", openHome);
refs.editBtn.addEventListener("click", openEditDialog);
refs.deleteBtn.addEventListener("click", handleDelete);
refs.exportBtn.addEventListener("click", exportBackup);
refs.importInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importBackup(file);
});
refs.friendForm.addEventListener("submit", handleSave);
refs.addCustomFieldBtn.addEventListener("click", () => addCustomField());
refs.closeDialogBtn.addEventListener("click", () => refs.friendDialog.close());
refs.cancelBtn.addEventListener("click", () => refs.friendDialog.close());
refs.photoInput.addEventListener("change", handlePhotoInput);
refs.removePhotoBtn.addEventListener("click", () => syncPhotoPreview(""));

load();
renderHome();
openHome();
startLoadingSequence();
