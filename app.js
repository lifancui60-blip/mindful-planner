(() => {
  'use strict';

  const STORAGE_KEY = 'zhixing-planner-v1';
  const MOODS = {
    1: { icon: '鈽?, label: '浣庤惤', color: '#d6d5cd' },
    2: { icon: '鈼?, label: '鐤叉儷', color: '#c7d4d0' },
    3: { icon: '鈼?, label: '骞抽潤', color: '#bdd5bb' },
    4: { icon: '鈽?, label: '涓嶉敊', color: '#efd18a' },
    5: { icon: '鉁?, label: '鎰夋偊', color: '#e8b88f' }
  };
  const PLAN_META = {
    daily: { tab: '鏃ヨ鍒?, period: '浠婂ぉ', title: '浠婂ぉ鐨勪笁浠朵簨', placeholder: '渚嬪锛氬畬鎴愭湰鍛ㄧ殑璇讳功绗旇' },
    monthly: { tab: '鏈堣鍒?, period: '鏈湀', title: '璁╄繖涓湀鏈夋敹鑾?, placeholder: '渚嬪锛氳瀹屼袱鏈功' },
    quarterly: { tab: '瀛ｅ害璁″垝', period: '鏈搴?, title: '涓轰笅涓€涓樁娈佃搫鍔?, placeholder: '渚嬪锛氬缓绔嬭繍鍔ㄤ範鎯? },
    yearly: { tab: '骞磋鍒?, period: '2026', title: '杩欎竴骞达紝鎴愪负鎯虫垚涓虹殑浜?, placeholder: '渚嬪锛氬畬鎴愪竴娆℃梾琛? }
  };
  const QUOTES = [
    '閲嶈鐨勪笉鏄畬鎴愬緱澶氾紝鑰屾槸浣犳槸鍚﹀湪鍚戣嚜宸遍潬杩戙€?,
    '鏃ュ瓙涓嶆槸鐢ㄦ潵璧剁殑锛屾槸鐢ㄦ潵鎱㈡參闀挎垚鑷繁鐨勩€?,
    '鎶婃敞鎰忓姏杩樼粰浠婂ぉ锛岀瓟妗堜細鍦ㄨ鍔ㄩ噷娴幇銆?,
    '鎰夸綘蹇冮噷鏈夊厜锛屼篃鏈夋妸鍏夎蛋鎴愯矾鐨勮€愬績銆?
  ];

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const dateKey = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  };
  const fromKey = key => new Date(`${key}T12:00:00`);
  const dayOffset = offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return dateKey(d);
  };
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
  const localDate = (key, options) => new Intl.DateTimeFormat('zh-CN', options).format(fromKey(key));
  const shortDate = key => localDate(key, { month: 'short', day: 'numeric' });
  const year = new Date().getFullYear();

  function makeDefaultData() {
    return {
      moods: [
        { id: uid(), date: dayOffset(-6), value: 3, note: '缁欒嚜宸辩暀浜嗕竴娈靛畨闈欓槄璇荤殑鏃堕棿銆? },
        { id: uid(), date: dayOffset(-5), value: 4, note: '瀹屾垚浜嗕竴浠舵嫋寤跺緢涔呯殑灏忎簨銆? },
        { id: uid(), date: dayOffset(-4), value: 2, note: '鏈夌偣鐤叉儷锛屼粖鏅氭棭鐐逛紤鎭€? },
        { id: uid(), date: dayOffset(-2), value: 4, note: '鍜屾湅鍙嬭亰浜嗚亰锛屽績鍙堟槑浜捣鏉ャ€? },
        { id: uid(), date: dayOffset(-1), value: 3, note: '骞抽潤鐨勪竴澶╋紝涔熷緢鐝嶈吹銆? }
      ],
      books: [
        { id: uid(), title: '涔熻浣犺鎵句釜浜鸿亰鑱?, author: '娲涜帀路鎴堢壒鍒╁竷', note: '鏀瑰彉骞朵笉鏄竴鍦虹獊濡傚叾鏉ョ殑闈╁懡锛岃€屾槸涓€娆℃璇氬疄鍦扮湅瑙佽嚜宸便€?, tags: ['蹇冪悊瀛?, '鑷垜鎺㈢储'], rating: 5, createdAt: dayOffset(-4) },
        { id: uid(), title: '缃韩浜嬪唴', author: '鍏板皬娆?, note: '鐞嗚В涓€浠朵簨锛屽厛瑕佺湅瑙佸畠鎵€澶勭殑鐪熷疄缁撴瀯鍜岀幆澧冦€?, tags: ['绀句細瀛?, '鎬濊€?], rating: 4, createdAt: dayOffset(-10) }
      ],
      plans: {
        daily: [
          { id: uid(), title: '瀹屾垚浜у搧璁捐鏂规鐨勭涓€鐗?, category: '宸ヤ綔', complete: true },
          { id: uid(), title: '闃呰 30 鍒嗛挓', category: '鎴愰暱', complete: false },
          { id: uid(), title: '鏅氶キ鍚庢暎姝?, category: '鐢熸椿', complete: false }
        ],
        monthly: [
          { id: uid(), title: '璇诲畬涓ゆ湰鎯宠寰堜箙鐨勪功', category: '闃呰', complete: false },
          { id: uid(), title: '瀹屾垚涓€娆″懆鏈緬姝?, category: '鐢熸椿', complete: false },
          { id: uid(), title: '鏁寸悊鑷繁鐨勭煡璇嗗簱', category: '鎴愰暱', complete: true }
        ],
        quarterly: [
          { id: uid(), title: '寤虹珛姣忓懆涓夋鐨勮繍鍔ㄤ範鎯?, category: '鍋ュ悍', complete: false },
          { id: uid(), title: '瀹屾垚涓€涓嫭绔嬩綔鍝?, category: '鍒涢€?, complete: false }
        ],
        yearly: [
          { id: uid(), title: '鎴愪负鏇寸ǔ瀹氥€佹洿鏉惧紱鐨勮嚜宸?, category: '鑷垜', complete: false },
          { id: uid(), title: '鍘讳竴涓檶鐢熺殑鍩庡競鐢熸椿涓€鍛?, category: '浣撻獙', complete: false },
          { id: uid(), title: '鐣欏嚭 100 灏忔椂缁欐繁搴﹂槄璇?, category: '闃呰', complete: false }
        ]
      },
      vision: '鍦ㄥ繖纰屼笌浠庡涔嬮棿鎵惧埌鑷繁鐨勮妭濂忥紝鎸佺画瀛︿範锛屼篃璁ょ湡鎰熷彈姣忎竴涓櫘閫氱殑鏃ュ瓙銆?
    };
  }

  function loadData() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && stored.moods && stored.books && stored.plans) return stored;
    } catch (_) { /* use defaults */ }
    return makeDefaultData();
  }

  let state = loadData();
  let activePlanType = 'daily';
  let selectedMood = 3;
  let selectedRating = 4;
  let modalPlanType = 'daily';
  let quoteIndex = 0;
  let toastTimer;

  function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function getMoodForDate(date) { return state.moods.find(entry => entry.date === date); }
  function sortedMoods() { return [...state.moods].sort((a, b) => b.date.localeCompare(a.date)); }
  function planStats(type) {
    const items = state.plans[type] || [];
    const done = items.filter(item => item.complete).length;
    return { items, done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 };
  }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2300);
  }

  function renderHeader() {
    const now = new Date();
    $('#today-label').textContent = new Intl.DateTimeFormat('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
    $('#week-label').textContent = `${now.getFullYear()} 路 绗?${week} 鍛╜;
  }

  function renderMoodChart() {
    const dates = [...Array(7)].map((_, index) => dayOffset(index - 6));
    $('#mood-chart').innerHTML = dates.map((date, index) => {
      const entry = getMoodForDate(date);
      const value = entry?.value || 0;
      const height = value ? 24 + value * 17 : 13;
      const color = value ? MOODS[value].color : '#e7e9e4';
      const cls = index === 6 ? ' today' : '';
      return `<div class="mood-bar${cls}" style="--bar-height:${height}px;--bar-color:${color}" title="${entry ? `${shortDate(date)} 路 ${MOODS[value].label}` : `${shortDate(date)} 路 鏈褰昤}"><span>${['涓€','浜?,'涓?,'鍥?,'浜?,'鍏?,'鏃?][fromKey(date).getDay() === 0 ? 6 : fromKey(date).getDay() - 1]}</span></div>`;
    }).join('');
  }

  function calculateStreak() {
    const dates = new Set(state.moods.map(item => item.date));
    let cursor = new Date();
    if (!dates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (dates.has(dateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
    return streak;
  }

  function renderHome() {
    const stats = planStats('daily');
    $('#today-progress-label').textContent = `${stats.done} / ${stats.total} 宸插畬鎴恅;
    $('#today-progress-value').textContent = `${stats.percent}%`;
    $('#today-ring').style.setProperty('--progress', stats.percent);
    const primary = stats.items.find(item => !item.complete) || stats.items[0];
    $('#focus-title').textContent = primary ? primary.title : '浠庝竴浠堕噸瑕佺殑浜嬪紑濮?;
    $('#focus-caption').textContent = primary ? `涓嬩竴姝ワ細${primary.category || '涓鸿嚜宸辩暀涓€鐐规椂闂?}` : '娣诲姞璁″垝鍚庯紝杩欓噷浼氭樉绀轰粖鏃ユ渶閲嶈鐨勭洰鏍囥€?;
    const taskList = $('#home-task-list');
    taskList.innerHTML = stats.items.length ? stats.items.map(item => taskRow(item, 'daily', 'task-row')).join('') : `<div class="empty-state">浠婂ぉ杩樻病鏈夊畨鎺掋€傜粰鏈潵鐨勮嚜宸变竴涓皬灏忕殑鎵胯鍚с€?/div>`;
    const streak = calculateStreak();
    $('#streak-count').textContent = streak;
    $('#streak-days').innerHTML = [...Array(7)].map((_, index) => {
      const has = Boolean(getMoodForDate(dayOffset(index - 6)));
      return `<span class="streak-day ${has ? 'checked' : ''}"></span>`;
    }).join('');
    renderMoodChart();
  }

  function taskRow(item, type, className = 'plan-item') {
    return `<div class="${className}${item.complete ? ' done' : ''}" data-plan-id="${item.id}" data-plan-type="${type}">
      <input class="check-input" type="checkbox" ${item.complete ? 'checked' : ''} aria-label="瀹屾垚 ${escapeHtml(item.title)}" />
      <span class="${className === 'task-row' ? 'task-title' : 'plan-item-title'}">${escapeHtml(item.title)}</span>
      ${item.category ? `<span class="${className === 'task-row' ? 'task-category' : 'category-pill'}">${escapeHtml(item.category)}</span>` : '<span></span>'}
      <button class="delete-item" aria-label="鍒犻櫎 ${escapeHtml(item.title)}">脳</button>
    </div>`;
  }

  function renderMoodPage() {
    const moods = sortedMoods();
    const lastMonth = moods.filter(entry => fromKey(entry.date) >= new Date(Date.now() - 29 * 86400000));
    const average = lastMonth.length ? (lastMonth.reduce((sum, item) => sum + item.value, 0) / lastMonth.length) : 0;
    const rounded = Math.round(average);
    $('#mood-average').textContent = average ? average.toFixed(1) : '鈥?;
    $('#mood-average-text').textContent = average ? `鏁翠綋鎰熻 ${MOODS[rounded].label}` : '杩樻病鏈夎冻澶熺殑璁板綍';
    $('#mood-big-icon').textContent = average ? MOODS[rounded].icon : '鈽?;
    const dates = [...Array(7)].map((_, index) => dayOffset(index - 6));
    $('#mood-week-calendar').innerHTML = dates.map(date => {
      const entry = getMoodForDate(date);
      const isToday = date === dateKey();
      return `<button class="mood-day${entry ? ' has-entry' : ''}${isToday ? ' current' : ''}" data-mood-date="${date}" title="${entry?.note || '灏氭湭璁板綍'}"><span class="dow">${['鏃?,'涓€','浜?,'涓?,'鍥?,'浜?,'鍏?][fromKey(date).getDay()]}</span><strong class="day-number">${fromKey(date).getDate()}</strong><span class="day-face">${entry ? MOODS[entry.value].icon : '鈥?}</span></button>`;
    }).join('');
    $('#mood-entry-count').textContent = `${moods.length} 鏉¤褰昤;
    $('#mood-timeline').innerHTML = moods.length ? moods.map(entry => `<article class="mood-entry"><span class="entry-mood-icon">${MOODS[entry.value].icon}</span><div><h3>${MOODS[entry.value].label}鐨勪粖澶?/h3><p>${escapeHtml(entry.note || '浠婂ぉ娌℃湁鐣欎笅鏂囧瓧锛屼絾浣犺寰楁劅鍙椼€?)}</p></div><time class="entry-date">${shortDate(entry.date)}</time></article>`).join('') : `<div class="empty-state">浠庝粖澶╁紑濮嬶紝鐢ㄤ竴鍒嗛挓鍜岃嚜宸辫涓潰銆?/div>`;
  }

  function renderBooks() {
    const books = [...state.books].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const uniqueTitles = new Set(books.map(book => book.title.trim().toLowerCase()));
    const average = books.length ? books.reduce((sum, book) => sum + Number(book.rating || 0), 0) / books.length : 0;
    $('#book-count').textContent = uniqueTitles.size;
    $('#book-note-count').textContent = books.length;
    $('#book-rating').textContent = average ? average.toFixed(1) : '鈥?;
    $('#book-grid').innerHTML = books.length ? books.map(book => `<article class="book-card" data-book-id="${book.id}"><div class="book-card-top"><span class="book-initial">${escapeHtml(book.title.charAt(0))}</span><span class="book-rating">${'鈽?.repeat(book.rating || 0)}${'鈽?.repeat(5 - (book.rating || 0))}</span></div><h3>${escapeHtml(book.title)}</h3><p class="book-author">${escapeHtml(book.author || '鏈讲鍚?)}</p><p class="book-note">${escapeHtml(book.note || '涓€娈靛皻鏈啓瀹岀殑鎬濊€冦€?)}</p><div class="book-footer"><div class="tag-list">${(book.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div><button class="card-delete" aria-label="鍒犻櫎绗旇" title="鍒犻櫎绗旇">脳</button></div></article>`).join('') : `<div class="empty-state">绗竴鏉¤涔︾瑪璁帮紝浼氭垚涓鸿繖閲屾渶鍔ㄤ汉鐨勫紑濮嬨€?/div>`;
  }

  function renderPlans() {
    const meta = PLAN_META[activePlanType];
    const stats = planStats(activePlanType);
    $$('.plan-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.planType === activePlanType));
    $('#plan-period-label').textContent = activePlanType === 'yearly' ? String(year) : meta.period;
    $('#plan-board-title').textContent = meta.title;
    $('#plan-board-progress-text').textContent = `${stats.percent}% 瀹屾垚`;
    $('#plan-board-progress-bar').style.width = `${stats.percent}%`;
    $('#plan-list').innerHTML = stats.items.length ? stats.items.map(item => taskRow(item, activePlanType)).join('') : `<div class="empty-state">杩欎竴椤佃繕鏄┖鐧姐€傛妸鎯虫硶鏀捐繘鏉ワ紝鍐嶆參鎱㈣瀹冨彂鐢熴€?/div>`;
    $('#vision-input').value = state.vision || '';
  }

  function renderAll() {
    renderHeader(); renderHome(); renderMoodPage(); renderBooks(); renderPlans();
  }

  function openModal(id) {
    $('#modal-backdrop').hidden = false;
    const modal = $(`#${id}`);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('button, input, textarea')?.focus(), 50);
  }
  function closeModals() {
    $$('.modal').forEach(modal => { modal.hidden = true; });
    $('#modal-backdrop').hidden = true;
    document.body.style.overflow = '';
  }
  function openPlanModal(type = activePlanType) {
    modalPlanType = type;
    $('#plan-modal-title').textContent = `娣诲姞${PLAN_META[type].tab.replace('璁″垝', '')}璁″垝`;
    $('#plan-title-input').placeholder = PLAN_META[type].placeholder;
    $('#plan-title-input').value = '';
    $('#plan-category-input').value = '';
    openModal('plan-modal');
  }

  function setView(view) {
    $$('.view').forEach(section => section.classList.toggle('active', section.id === `${view}-view`));
    $$('.nav-item[data-view-target]').forEach(button => button.classList.toggle('active', button.dataset.viewTarget === view));
    $('.sidebar').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function togglePlanItem(target) {
    const row = target.closest('[data-plan-id]');
    if (!row) return;
    const item = state.plans[row.dataset.planType].find(plan => plan.id === row.dataset.planId);
    if (!item) return;
    item.complete = !item.complete;
    saveData(); renderHome(); renderPlans();
    showToast(item.complete ? '瀹屾垚涓€灏忔锛岀湡濂姐€? : '宸查噸鏂版斁鍥炶鍒掋€?);
  }
  function deletePlanItem(target) {
    const row = target.closest('[data-plan-id]');
    if (!row) return;
    const list = state.plans[row.dataset.planType];
    const item = list.find(plan => plan.id === row.dataset.planId);
    if (!item) return;
    state.plans[row.dataset.planType] = list.filter(plan => plan.id !== item.id);
    saveData(); renderHome(); renderPlans(); showToast('璁″垝宸插垹闄ゃ€?);
  }
  function setMood(value) {
    selectedMood = Number(value);
    $$('#mood-picker button').forEach(button => button.classList.toggle('selected', Number(button.dataset.mood) === selectedMood));
  }
  function setRating(value) {
    selectedRating = Number(value);
    $$('#rating-picker button').forEach(button => button.classList.toggle('selected', Number(button.dataset.rating) <= selectedRating));
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const viewButton = event.target.closest('[data-view-target]');
      if (viewButton) { setView(viewButton.dataset.viewTarget); return; }
      const modalButton = event.target.closest('[data-open-modal]');
      if (modalButton) { openModal(modalButton.dataset.openModal); return; }
      if (event.target.closest('[data-close-modal]') || event.target === $('#modal-backdrop')) { closeModals(); return; }
      if (event.target.closest('#quick-add')) { openPlanModal('daily'); return; }
      if (event.target.closest('[data-add-task]')) { openPlanModal(event.target.closest('[data-add-task]').dataset.addTask); return; }
      if (event.target.closest('#add-plan-button') || event.target.closest('#add-plan-row')) { openPlanModal(activePlanType); return; }
      const planTab = event.target.closest('.plan-tab');
      if (planTab) { activePlanType = planTab.dataset.planType; renderPlans(); return; }
      if (event.target.closest('.check-input')) { togglePlanItem(event.target); return; }
      if (event.target.closest('.delete-item')) { deletePlanItem(event.target); return; }
      const moodPick = event.target.closest('#mood-picker button');
      if (moodPick) { setMood(moodPick.dataset.mood); return; }
      const ratingPick = event.target.closest('#rating-picker button');
      if (ratingPick) { setRating(ratingPick.dataset.rating); return; }
      const deleteBook = event.target.closest('.card-delete');
      if (deleteBook) {
        const card = deleteBook.closest('[data-book-id]');
        state.books = state.books.filter(book => book.id !== card.dataset.bookId);
        saveData(); renderBooks(); showToast('绗旇宸插垹闄ゃ€?); return;
      }
      if (event.target.closest('#change-quote')) { quoteIndex = (quoteIndex + 1) % QUOTES.length; $('#reflection-quote').textContent = QUOTES[quoteIndex]; return; }
      const moodDay = event.target.closest('[data-mood-date]');
      if (moodDay) {
        const entry = getMoodForDate(moodDay.dataset.moodDate);
        if (entry) showToast(`${shortDate(entry.date)} 路 ${MOODS[entry.value].label}${entry.note ? `锛?{entry.note}` : ''}`);
        return;
      }
    });

    $('#save-mood').addEventListener('click', () => {
      const today = dateKey();
      const note = $('#mood-note').value.trim();
      const existing = getMoodForDate(today);
      if (existing) { existing.value = selectedMood; existing.note = note; }
      else state.moods.push({ id: uid(), date: today, value: selectedMood, note });
      saveData(); renderHome(); renderMoodPage(); closeModals(); $('#mood-note').value = '';
      showToast('浠婂ぉ鐨勬劅鍙楀凡瀹夋斁濂姐€?);
    });

    $('#save-book').addEventListener('click', () => {
      const title = $('#book-title-input').value.trim();
      if (!title) { showToast('鍏堝啓涓嬭繖鏈功鐨勫悕瀛楀惂銆?); $('#book-title-input').focus(); return; }
      const tags = $('#book-tags-input').value.split(/[,锛宂/).map(tag => tag.trim()).filter(Boolean).slice(0, 4);
      state.books.push({ id: uid(), title, author: $('#book-author-input').value.trim(), note: $('#book-note-input').value.trim(), tags, rating: selectedRating, createdAt: dateKey() });
      saveData(); renderBooks(); closeModals();
      ['#book-title-input', '#book-author-input', '#book-note-input', '#book-tags-input'].forEach(id => { $(id).value = ''; }); setRating(4);
      showToast('杩欎唤鍚彂宸茬粡鏀跺ソ浜嗐€?);
    });

    $('#save-plan').addEventListener('click', () => {
      const title = $('#plan-title-input').value.trim();
      if (!title) { showToast('鍏堝啓涓嬩竴浠舵兂瀹屾垚鐨勪簨鍚с€?); $('#plan-title-input').focus(); return; }
      state.plans[modalPlanType].push({ id: uid(), title, category: $('#plan-category-input').value.trim(), complete: false });
      saveData(); renderHome(); renderPlans(); closeModals(); showToast('鏂扮殑琛屽姩宸茬粡鍐欒繘璁″垝銆?);
    });

    let visionTimer;
    $('#vision-input').addEventListener('input', event => {
      clearTimeout(visionTimer);
      visionTimer = setTimeout(() => { state.vision = event.target.value; saveData(); }, 350);
    });
    $('#mobile-menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
    $('#export-data').addEventListener('click', () => {
      const content = JSON.stringify({ app: '鐭ヨ', exportedAt: new Date().toISOString(), data: state }, null, 2);
      const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `鐭ヨ鏁版嵁-${dateKey()}.json`; link.click(); URL.revokeObjectURL(url); showToast('鏁版嵁鏂囦欢宸插紑濮嬩笅杞姐€?);
    });
    $('#reset-data').addEventListener('click', () => {
      if (window.confirm('鎭㈠绀轰緥鍐呭浼氳鐩栧綋鍓嶄繚瀛樺湪鏈満鐨勬暟鎹紝纭畾缁х画鍚楋紵')) { state = makeDefaultData(); saveData(); renderAll(); showToast('宸叉仮澶嶇ず渚嬪唴瀹广€?); }
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModals(); });
  }

  renderAll();
  setMood(selectedMood); setRating(selectedRating); bindEvents();
})();

