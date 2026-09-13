(() => {
  const $ = id => document.getElementById(id);
  const add = $('addFriendBtn');
  const dialog = $('friendDialog');
  const form = $('friendForm');
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DATA_KEY_FALLBACK = 'friendDossier.v4';

  function ensureMonths() {
    ['birthdayMonth','entryMonth'].forEach(id => {
      const select = $(id);
      if (!select) return;
      const current = select.value;
      select.innerHTML = '<option value="">Month</option>' + MONTH_NAMES.map((month, i) => `<option value="${i + 1}">${month}</option>`).join('');
      if (current) select.value = current;
      select.disabled = false;
      select.style.pointerEvents = 'auto';
    });
  }

  function safeOpen(el) {
    if (!el) return;
    try {
      if (typeof el.showModal === 'function' && !el.open) el.showModal();
      else if (!el.open) el.setAttribute('open', '');
    } catch (err) {
      console.error('Could not open dialog', err);
      el.setAttribute('open', '');
    }
  }

  function safeClose(el) {
    if (!el) return;
    try {
      if (typeof el.close === 'function' && el.open) el.close();
      else el.removeAttribute('open');
    } catch (err) {
      console.error('Could not close dialog', err);
      el.removeAttribute('open');
    }
  }

  function ensureStyleFields() {
    if (!form) return;
    if ($('friendBubbleColour') && $('friendFrameColour') && $('friendFrameStyle')) return;
    const saveBtn = form.querySelector('.primary-button');
    if (!saveBtn) return;
    const wrap = document.createElement('div');
    wrap.id = 'personStyleEditor';
    wrap.className = 'person-style-editor';
    wrap.innerHTML = `
      <h3>Bubble appearance</h3>
      <div class="person-colours">
        <label>Bubble colour<input id="friendBubbleColour" type="color" value="#b9d8ff"></label>
        <label>Frame colour<input id="friendFrameColour" type="color" value="#e2b5ff"></label>
      </div>
      <div class="frame-heading">Frame</div>
      <div class="frame-picker">
        <button type="button" data-frame="plain" class="frame-option active"><span class="frame-preview preview-plain"></span><b>Plain</b></button>
        <button type="button" data-frame="flowers" class="frame-option"><span class="frame-preview preview-flowers"></span><b>Flowers</b></button>
        <button type="button" data-frame="shards" class="frame-option"><span class="frame-preview preview-shards"></span><b>Shards</b></button>
      </div>
      <input id="friendFrameStyle" type="hidden" value="plain">
    `;
    form.insertBefore(wrap, saveBtn);
    wrap.querySelectorAll('.frame-option').forEach(btn => {
      btn.addEventListener('click', () => {
        $('friendFrameStyle').value = btn.dataset.frame;
        wrap.querySelectorAll('.frame-option').forEach(x => x.classList.toggle('active', x === btn));
      });
    });
  }

  function openAddFriend() {
    if (!dialog || !form) return;
    try {
      ensureStyleFields();
      ensureMonths();
      form.reset();
      if ($('friendId')) $('friendId').value = '';
      if ($('friendDialogTitle')) $('friendDialogTitle').textContent = 'Add friend';
      if ($('photoData')) $('photoData').value = '';
      if ($('photoPreviewWrap')) $('photoPreviewWrap').innerHTML = '<span>📷</span>';
      if ($('friendBubbleColour')) $('friendBubbleColour').value = getComputedStyle(document.documentElement).getPropertyValue('--bubble').trim() || '#b9d8ff';
      if ($('friendFrameColour')) $('friendFrameColour').value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e2b5ff';
      if ($('friendFrameStyle')) $('friendFrameStyle').value = 'plain';
      const wrap = $('personStyleEditor');
      if (wrap) wrap.querySelectorAll('.frame-option').forEach(x => x.classList.toggle('active', x.dataset.frame === 'plain'));
    } catch (err) {
      console.error('Add friend setup failed', err);
    }
    safeOpen(dialog);
  }

  function makeId() {
    return (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function readStoredFriends() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DATA_KEY_FALLBACK) || '[]');
      return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.friends) ? parsed.friends : [];
    } catch {
      return [];
    }
  }

  function saveFriendFallback(event) {
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    if (!form || !form.reportValidity()) return;

    const id = $('friendId')?.value || makeId();
    const name = $('friendName')?.value.trim() || '';
    if (!name) return;

    const existingStored = readStoredFriends();
    const existing = existingStored.find(friend => friend.id === id);
    const newFriend = {
      id,
      name,
      relationship: $('friendRelation')?.value.trim() || '',
      imageData: $('photoData')?.value || '',
      birthdayDay: Number($('birthdayDay')?.value) || '',
      birthdayMonth: Number($('birthdayMonth')?.value) || '',
      birthdayYear: Number($('birthdayYear')?.value) || '',
      entries: existing?.entries || [],
      bubbleColor: $('friendBubbleColour')?.value || getComputedStyle(document.documentElement).getPropertyValue('--bubble').trim() || '#b9d8ff',
      frameStyle: $('friendFrameStyle')?.value || 'plain',
      frameColor: $('friendFrameColour')?.value || getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e2b5ff'
    };

    try {
      if (typeof state !== 'undefined' && state && Array.isArray(state.friends)) {
        const index = state.friends.findIndex(friend => friend.id === id);
        if (index >= 0) {
          newFriend.entries = state.friends[index].entries || newFriend.entries;
          state.friends[index] = newFriend;
        } else {
          state.friends.push(newFriend);
        }
        localStorage.setItem(DATA_KEY_FALLBACK, JSON.stringify(state.friends));
        if (typeof renderHome === 'function') renderHome();
      } else {
        const index = existingStored.findIndex(friend => friend.id === id);
        if (index >= 0) existingStored[index] = newFriend;
        else existingStored.push(newFriend);
        localStorage.setItem(DATA_KEY_FALLBACK, JSON.stringify(existingStored));
      }
    } catch (err) {
      console.error('Could not save friend', err);
      return;
    }

    safeClose(dialog);
    try { if (typeof showToast === 'function') showToast(existing ? 'Person updated' : 'Friend added'); } catch {}
  }

  ensureMonths();

  if (add) add.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    openAddFriend();
  }, { capture: true });

  if (form) {
    const saveBtn = form.querySelector('.primary-button');
    if (saveBtn) {
      saveBtn.type = 'button';
      saveBtn.addEventListener('click', saveFriendFallback, { capture: true });
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      saveFriendFallback(event);
    }, { capture: true });
  }

  const settingsBtn = $('settingsBtn');
  const settingsDialog = $('settingsDialog');
  if (settingsBtn && settingsDialog) {
    settingsBtn.addEventListener('click', event => {
      event.preventDefault();
      try {
        const bg = $('bgColour'), accent = $('accentColour'), bubble = $('bubbleColour');
        const styles = getComputedStyle(document.documentElement);
        if (bg) bg.value = styles.getPropertyValue('--bg').trim() || '#171124';
        if (accent) accent.value = styles.getPropertyValue('--accent').trim() || '#e2b5ff';
        if (bubble) bubble.value = styles.getPropertyValue('--bubble').trim() || '#b9d8ff';
        if (typeof openSettings === 'function') {
          openSettings();
          return;
        }
      } catch (err) {
        console.error('Settings setup failed', err);
      }
      safeOpen(settingsDialog);
    }, { capture: true });
  }

  document.addEventListener('click', event => {
    const closeButton = event.target.closest('[data-close]');
    if (!closeButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    safeClose($(closeButton.dataset.close));
  }, { capture: true });

  document.querySelectorAll('dialog').forEach(modal => {
    modal.addEventListener('cancel', event => {
      event.preventDefault();
      safeClose(modal);
    });
  });
})();
