(() => {
  const $ = id => document.getElementById(id);
  const add = $('addFriendBtn');
  const dialog = $('friendDialog');
  const form = $('friendForm');
  if (!add || !dialog || !form) return;

  function ensureStyleFields() {
    if ($('friendBubbleColour') && $('friendFrameColour') && $('friendFrameStyle')) return;
    const saveBtn = form.querySelector('.primary-button');
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
        <button type="button" data-frame="flowers" class="frame-option"><span class="frame-preview preview-flowers">✿ ❀ ✿</span><b>Flowers</b></button>
        <button type="button" data-frame="shards" class="frame-option"><span class="frame-preview preview-shards">◆ ◇ ◆</span><b>Shards</b></button>
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
    try {
      ensureStyleFields();
      form.reset();
      if ($('friendId')) $('friendId').value = '';
      if ($('friendDialogTitle')) $('friendDialogTitle').textContent = 'Add friend';
      if ($('photoData')) $('photoData').value = '';
      if ($('photoPreviewWrap')) $('photoPreviewWrap').innerHTML = '<span>📷</span>';
      if ($('friendBubbleColour')) $('friendBubbleColour').value = getComputedStyle(document.documentElement).getPropertyValue('--bubble').trim() || '#b9d8ff';
      if ($('friendFrameColour')) $('friendFrameColour').value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e2b5ff';
      if ($('friendFrameStyle')) $('friendFrameStyle').value = 'plain';
      wrap = $('personStyleEditor');
      if (wrap) wrap.querySelectorAll('.frame-option').forEach(x => x.classList.toggle('active', x.dataset.frame === 'plain'));
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    } catch (err) {
      console.error('Add friend fallback failed', err);
      if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    }
  }

  add.addEventListener('click', openAddFriend, { capture: true });
})();
