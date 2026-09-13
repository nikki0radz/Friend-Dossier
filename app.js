const STORAGE_KEY = "peopleNotes.v1";

const state = {
  friends: [],
  selectedId: null,
};

const $ = (id) => document.getElementById(id);

const refs = {
  friendList: $("friendList"),
  friendCount: $("friendCount"),
  searchInput: $("searchInput"),
  addFriendBtn: $("addFriendBtn"),
  emptyAddBtn: $("emptyAddBtn"),
  emptyState: $("emptyState"),
  profileView: $("profileView"),
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
  exportBtn: $("exportBtn"),
  importInput: $("importInput"),
  toast: $("toast"),
};

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      state.friends = parsed;
      state.selectedId = parsed[0]?.id ?? null;
    }
  } catch (error) {
    console.warn("Could not load saved data.", error);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.friends));
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "?";
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
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

function getSelectedFriend() {
  return state.friends.find(friend => friend.id === state.selectedId) || null;
}

function renderFriendList() {
  const query = refs.searchInput.value.trim().toLowerCase();
  const filtered = state.friends.filter(friend => {
    const haystack = [friend.name, friend.relationship, ...(friend.likes || []), friend.notes].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  refs.friendCount.textContent = String(state.friends.length);
  refs.friendList.innerHTML = "";

  filtered.sort((a, b) => a.name.localeCompare(b.name)).forEach(friend => {
    const button = document.createElement("button");
    button.className = `friend-row ${friend.id === state.selectedId ? "active" : ""}`;
    button.innerHTML = `
      <div class="avatar">${escapeHtml(initials(friend.name))}</div>
      <div class="friend-meta">
        <strong>${escapeHtml(friend.name)}</strong>
        <span>${escapeHtml(friend.relationship || "No label")}</span>
      </div>
    `;
    button.addEventListener("click", () => {
      state.selectedId = friend.id;
      render();
    });
    refs.friendList.appendChild(button);
  });

  if (!filtered.length && state.friends.length) {
    const message = document.createElement("div");
    message.className = "empty-value";
    message.style.padding = "12px";
    message.textContent = "No people match that search.";
    refs.friendList.appendChild(message);
  }
}

function renderProfile() {
  const friend = getSelectedFriend();

  if (!friend) {
    refs.emptyState.classList.remove("hidden");
    refs.profileView.classList.add("hidden");
    return;
  }

  refs.emptyState.classList.add("hidden");
  refs.profileView.classList.remove("hidden");
  refs.profileAvatar.textContent = initials(friend.name);
  refs.profileName.textContent = friend.name;
  refs.profileSubtitle.textContent = friend.relationship || "No label yet";

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
  if (!refs.customDisplay.children.length) refs.customDisplay.innerHTML = emptyValue("No extra details yet.");
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

function render() {
  if (state.selectedId && !getSelectedFriend()) state.selectedId = state.friends[0]?.id ?? null;
  renderFriendList();
  renderProfile();
}

function openAddDialog() {
  refs.dialogTitle.textContent = "Add person";
  refs.friendForm.reset();
  refs.friendId.value = "";
  refs.customFields.innerHTML = "";
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

  if (friend.custom?.length) friend.custom.forEach(item => addCustomField(item.label, item.value));
  else addCustomField();

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
  render();
}

function handleDelete() {
  const friend = getSelectedFriend();
  if (!friend) return;
  const ok = confirm(`Delete ${friend.name}? This removes their notes from this browser.`);
  if (!ok) return;
  state.friends = state.friends.filter(item => item.id !== friend.id);
  state.selectedId = state.friends[0]?.id ?? null;
  save();
  render();
  showToast("Person deleted");
}

function exportBackup() {
  const payload = { version: 1, exportedAt: new Date().toISOString(), friends: state.friends };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `people-notes-backup-${new Date().toISOString().slice(0,10)}.json`;
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
    const ok = confirm(`Import ${friends.length} people? This will replace the data currently saved in this browser.`);
    if (!ok) return;
    state.friends = friends;
    state.selectedId = friends[0]?.id ?? null;
    save();
    render();
    showToast("Backup imported");
  } catch (error) {
    alert("That file does not look like a valid People Notes backup.");
  } finally {
    refs.importInput.value = "";
  }
}

refs.addFriendBtn.addEventListener("click", openAddDialog);
refs.emptyAddBtn.addEventListener("click", openAddDialog);
refs.editBtn.addEventListener("click", openEditDialog);
refs.deleteBtn.addEventListener("click", handleDelete);
refs.addCustomFieldBtn.addEventListener("click", () => addCustomField());
refs.closeDialogBtn.addEventListener("click", () => refs.friendDialog.close());
refs.cancelBtn.addEventListener("click", () => refs.friendDialog.close());
refs.friendForm.addEventListener("submit", handleSave);
refs.searchInput.addEventListener("input", renderFriendList);
refs.exportBtn.addEventListener("click", exportBackup);
refs.importInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importBackup(file);
});

load();
render();
