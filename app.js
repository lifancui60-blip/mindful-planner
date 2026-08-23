(() => {
  'use strict';

  const STORAGE_KEY = 'zhixing-planner-v1';
  const MOODS = {
    1: { icon: '☁', label: '低落', color: '#d6d5cd' },
    2: { icon: '◌', label: '疲惫', color: '#c7d4d0' },
    3: { icon: '◐', label: '平静', color: '#bdd5bb' },
    4: { icon: '☼', label: '不错', color: '#efd18a' },
    5: { icon: '✦', label: '愉悦', color: '#e8b88f' }
  };
  const PLAN_META = {
    daily: { tab: '日计划', period: '今天', title: '今天的三件事', placeholder: '例如：完成本周的读书笔记' },
    monthly: { tab: '月计划', period: '本月', title: '让这个月有收获', placeholder: '例如：读完两本书' },
    quarterly: { tab: '季度计划', period: '本季度', title: '为下一个阶段蓄力', placeholder: '例如：建立运动习惯' },
    yearly: { tab: '年计划', period: '2026', title: '这一年，成为想成为的人', placeholder: '例如：完成一次旅行' }
  };
  const QUOTES = [
    '重要的不是完成得多，而是你是否在向自己靠近。',
    '日子不是用来赶的，是用来慢慢长成自己的。',
    '把注意力还给今天，答案会在行动里浮现。',
    '愿你心里有光，也有把光走成路的耐心。'
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
        { id: uid(), date: dayOffset(-6), value: 3, note: '给自己留了一段安静阅读的时间。' },
        { id: uid(), date: dayOffset(-5), value: 4, note: '完成了一件拖延很久的小事。' },
        { id: uid(), date: dayOffset(-4), value: 2, note: '有点疲惫，今晚早点休息。' },
        { id: uid(), date: dayOffset(-2), value: 4, note: '和朋友聊了聊，心又明亮起来。' },
        { id: uid(), date: dayOffset(-1), value: 3, note: '平静的一天，也很珍贵。' }
      ],
      books: [
        { id: uid(), title: '也许你该找个人聊聊', author: '洛莉·戈特利布', note: '改变并不是一场突如其来的革命，而是一次次诚实地看见自己。', tags: ['心理学', '自我探索'], rating: 5, createdAt: dayOffset(-4) },
        { id: uid(), title: '置身事内', author: '兰小欢', note: '理解一件事，先要看见它所处的真实结构和环境。', tags: ['社会学', '思考'], rating: 4, createdAt: dayOffset(-10) }
      ],
      plans: {
        daily: [
          { id: uid(), title: '完成产品设计方案的第一版', category: '工作', complete: true },
          { id: uid(), title: '阅读 30 分钟', category: '成长', complete: false },
          { id: uid(), title: '晚饭后散步', category: '生活', complete: false }
        ],
        monthly: [
          { id: uid(), title: '读完两本想读很久的书', category: '阅读', complete: false },
          { id: uid(), title: '完成一次周末徒步', category: '生活', complete: false },
          { id: uid(), title: '整理自己的知识库', category: '成长', complete: true }
        ],
        quarterly: [
          { id: uid(), title: '建立每周三次的运动习惯', category: '健康', complete: false },
          { id: uid(), title: '完成一个独立作品', category: '创造', complete: false }
        ],
        yearly: [
          { id: uid(), title: '成为更稳定、更松弛的自己', category: '自我', complete: false },
          { id: uid(), title: '去一个陌生的城市生活一周', category: '体验', complete: false },
          { id: uid(), title: '留出 100 小时给深度阅读', category: '阅读', complete: false }
        ]
      },
      vision: '在忙碌与从容之间找到自己的节奏，持续学习，也认真感受每一个普通的日子。'
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
    $('#week-label').textContent = `${now.getFullYear()} · 第 ${week} 周`;
  }

  function renderMoodChart() {
    const dates = [...Array(7)].map((_, index) => dayOffset(index - 6));
    $('#mood-chart').innerHTML = dates.map((date, index) => {
      const entry = getMoodForDate(date);
      const value = entry?.value || 0;
      const height = value ? 24 + value * 17 : 13;
      const color = value ? MOODS[value].color : '#e7e9e4';
      const cls = index === 6 ? ' today' : '';
      return `<div class="mood-bar${cls}" style="--bar-height:${height}px;--bar-color:${color}" title="${entry ? `${shortDate(date)} · ${MOODS[value].label}` : `${shortDate(date)} · 未记录`}"><span>${['一','二','三','四','五','六','日'][fromKey(date).getDay() === 0 ? 6 : fromKey(date).getDay() - 1]}</span></div>`;
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
    $('#today-progress-label').textContent = `${stats.done} / ${stats.total} 已完成`;
    $('#today-progress-value').textContent = `${stats.percent}%`;
    $('#today-ring').style.setProperty('--progress', stats.percent);
    const primary = stats.items.find(item => !item.complete) || stats.items[0];
    $('#focus-title').textContent = primary ? primary.title : '从一件重要的事开始';
    $('#focus-caption').textContent = primary ? `下一步：${primary.category || '为自己留一点时间'}` : '添加计划后，这里会显示今日最重要的目标。';
    const taskList = $('#home-task-list');
    taskList.innerHTML = stats.items.length ? stats.items.map(item => taskRow(item, 'daily', 'task-row')).join('') : `<div class="empty-state">今天还没有安排。给未来的自己一个小小的承诺吧。</div>`;
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
      <input class="check-input" type="checkbox" ${item.complete ? 'checked' : ''} aria-label="完成 ${escapeHtml(item.title)}" />
      <span class="${className === 'task-row' ? 'task-title' : 'plan-item-title'}">${escapeHtml(item.title)}</span>
      ${item.category ? `<span class="${className === 'task-row' ? 'task-category' : 'category-pill'}">${escapeHtml(item.category)}</span>` : '<span></span>'}
      <button class="delete-item" aria-label="删除 ${escapeHtml(item.title)}">×</button>
    </div>`;
  }

  function renderMoodPage() {
    const moods = sortedMoods();
    const lastMonth = moods.filter(entry => fromKey(entry.date) >= new Date(Date.now() - 29 * 86400000));
    const average = lastMonth.length ? (lastMonth.reduce((sum, item) => sum + item.value, 0) / lastMonth.length) : 0;
    const rounded = Math.round(average);
    $('#mood-average').textContent = average ? average.toFixed(1) : '—';
    $('#mood-average-text').textContent = average ? `整体感觉 ${MOODS[rounded].label}` : '还没有足够的记录';
    $('#mood-big-icon').textContent = average ? MOODS[rounded].icon : '☼';
    const dates = [...Array(7)].map((_, index) => dayOffset(index - 6));
    $('#mood-week-calendar').innerHTML = dates.map(date => {
      const entry = getMoodForDate(date);
      const isToday = date === dateKey();
      return `<button class="mood-day${entry ? ' has-entry' : ''}${isToday ? ' current' : ''}" data-mood-date="${date}" title="${entry?.note || '尚未记录'}"><span class="dow">${['日','一','二','三','四','五','六'][fromKey(date).getDay()]}</span><strong class="day-number">${fromKey(date).getDate()}</strong><span class="day-face">${entry ? MOODS[entry.value].icon : '—'}</span></button>`;
    }).join('');
    $('#mood-entry-count').textContent = `${moods.length} 条记录`;
    $('#mood-timeline').innerHTML = moods.length ? moods.map(entry => `<article class="mood-entry"><span class="entry-mood-icon">${MOODS[entry.value].icon}</span><div><h3>${MOODS[entry.value].label}的今天</h3><p>${escapeHtml(entry.note || '今天没有留下文字，但你记得感受。')}</p></div><time class="entry-date">${shortDate(entry.date)}</time></article>`).join('') : `<div class="empty-state">从今天开始，用一分钟和自己见个面。</div>`;
  }

  function renderBooks() {
    const books = [...state.books].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const uniqueTitles = new Set(books.map(book => book.title.trim().toLowerCase()));
    const average = books.length ? books.reduce((sum, book) => sum + Number(book.rating || 0), 0) / books.length : 0;
    $('#book-count').textContent = uniqueTitles.size;
    $('#book-note-count').textContent = books.length;
    $('#book-rating').textContent = average ? average.toFixed(1) : '—';
    $('#book-grid').innerHTML = books.length ? books.map(book => `<article class="book-card" data-book-id="${book.id}"><div class="book-card-top"><span class="book-initial">${escapeHtml(book.title.charAt(0))}</span><span class="book-rating">${'★'.repeat(book.rating || 0)}${'☆'.repeat(5 - (book.rating || 0))}</span></div><h3>${escapeHtml(book.title)}</h3><p class="book-author">${escapeHtml(book.author || '未署名')}</p><p class="book-note">${escapeHtml(book.note || '一段尚未写完的思考。')}</p><div class="book-footer"><div class="tag-list">${(book.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div><button class="card-delete" aria-label="删除笔记" title="删除笔记">×</button></div></article>`).join('') : `<div class="empty-state">第一条读书笔记，会成为这里最动人的开始。</div>`;
  }

  function renderPlans() {
    const meta = PLAN_META[activePlanType];
    const stats = planStats(activePlanType);
    $$('.plan-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.planType === activePlanType));
    $('#plan-period-label').textContent = activePlanType === 'yearly' ? String(year) : meta.period;
    $('#plan-board-title').textContent = meta.title;
    $('#plan-board-progress-text').textContent = `${stats.percent}% 完成`;
    $('#plan-board-progress-bar').style.width = `${stats.percent}%`;
    $('#plan-list').innerHTML = stats.items.length ? stats.items.map(item => taskRow(item, activePlanType)).join('') : `<div class="empty-state">这一页还是空白。把想法放进来，再慢慢让它发生。</div>`;
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
    $('#plan-modal-title').textContent = `添加${PLAN_META[type].tab.replace('计划', '')}计划`;
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
    showToast(item.complete ? '完成一小步，真好。' : '已重新放回计划。');
  }
  function deletePlanItem(target) {
    const row = target.closest('[data-plan-id]');
    if (!row) return;
    const list = state.plans[row.dataset.planType];
    const item = list.find(plan => plan.id === row.dataset.planId);
    if (!item) return;
    state.plans[row.dataset.planType] = list.filter(plan => plan.id !== item.id);
    saveData(); renderHome(); renderPlans(); showToast('计划已删除。');
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
        saveData(); renderBooks(); showToast('笔记已删除。'); return;
      }
      if (event.target.closest('#change-quote')) { quoteIndex = (quoteIndex + 1) % QUOTES.length; $('#reflection-quote').textContent = QUOTES[quoteIndex]; return; }
      const moodDay = event.target.closest('[data-mood-date]');
      if (moodDay) {
        const entry = getMoodForDate(moodDay.dataset.moodDate);
        if (entry) showToast(`${shortDate(entry.date)} · ${MOODS[entry.value].label}${entry.note ? `：${entry.note}` : ''}`);
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
      showToast('今天的感受已安放好。');
    });

    $('#save-book').addEventListener('click', () => {
      const title = $('#book-title-input').value.trim();
      if (!title) { showToast('先写下这本书的名字吧。'); $('#book-title-input').focus(); return; }
      const tags = $('#book-tags-input').value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean).slice(0, 4);
      state.books.push({ id: uid(), title, author: $('#book-author-input').value.trim(), note: $('#book-note-input').value.trim(), tags, rating: selectedRating, createdAt: dateKey() });
      saveData(); renderBooks(); closeModals();
      ['#book-title-input', '#book-author-input', '#book-note-input', '#book-tags-input'].forEach(id => { $(id).value = ''; }); setRating(4);
      showToast('这份启发已经收好了。');
    });

    $('#save-plan').addEventListener('click', () => {
      const title = $('#plan-title-input').value.trim();
      if (!title) { showToast('先写下一件想完成的事吧。'); $('#plan-title-input').focus(); return; }
      state.plans[modalPlanType].push({ id: uid(), title, category: $('#plan-category-input').value.trim(), complete: false });
      saveData(); renderHome(); renderPlans(); closeModals(); showToast('新的行动已经写进计划。');
    });

    let visionTimer;
    $('#vision-input').addEventListener('input', event => {
      clearTimeout(visionTimer);
      visionTimer = setTimeout(() => { state.vision = event.target.value; saveData(); }, 350);
    });
    $('#mobile-menu').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
    $('#export-data').addEventListener('click', () => {
      const content = JSON.stringify({ app: '知行', exportedAt: new Date().toISOString(), data: state }, null, 2);
      const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `知行数据-${dateKey()}.json`; link.click(); URL.revokeObjectURL(url); showToast('数据文件已开始下载。');
    });
    $('#reset-data').addEventListener('click', () => {
      if (window.confirm('恢复示例内容会覆盖当前保存在本机的数据，确定继续吗？')) { state = makeDefaultData(); saveData(); renderAll(); showToast('已恢复示例内容。'); }
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModals(); });
  }

  renderAll();
  setMood(selectedMood); setRating(selectedRating); bindEvents();
})();
