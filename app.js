const LS_GAS_URL = 'stella_civil_gas_url';
const LS_LOCAL_NEWS = 'stella_civil_local_news';

const FALLBACK_SAMPLE = {
  news: [
    {
      id: 'n-001',
      date: '2026-04-30T09:00:00+09:00',
      nation: 'ルメリア連邦',
      author: '星都通信',
      category: '外交',
      title: 'ルメリア連邦、アルカディア王国と文化交流協定を締結',
      body: '両国は留学生派遣、共同祭典、報道機関連携を柱とする文化交流協定に署名した。政府関係者は、軍事的緊張を避けながら相互理解を深める一歩だと説明している。',
    },
    {
      id: 'n-002',
      date: '2026-04-29T21:30:00+09:00',
      nation: 'ヴェルデ共和国',
      author: 'ヴェルデ民報',
      category: '経済',
      title: '新交易港の整備計画、国内議会で可決',
      body: 'ヴェルデ共和国議会は、東岸の交易港拡張と税関データ整備を含む経済政策を可決した。周辺国との貿易路増加に向け、民間企業の参入も募集される。',
    },
    {
      id: 'n-003',
      date: '2026-04-28T18:15:00+09:00',
      nation: 'ノクス帝国',
      author: '帝都観測局',
      category: '軍事',
      title: '北方方面軍が演習を終了、国境警備は通常体制へ',
      body: 'ノクス帝国軍は三日間の北方演習を終了したと発表した。周辺国からは懸念の声もあったが、外務局は防衛目的の訓練であり侵攻準備ではないと説明した。',
    },
    {
      id: 'n-004',
      date: '2026-04-27T12:10:00+09:00',
      nation: 'アルカディア王国',
      author: '王立広報院',
      category: '政治',
      title: '王国評議会、難民支援基金の創設を発表',
      body: 'アルカディア王国は災害・戦争で移動を余儀なくされた住民を支援する基金を創設する。初年度は食料、医療、仮設住宅の支援に重点を置く。',
    },
  ],
  diplomacy: {
    nations: ['ルメリア連邦', 'アルカディア王国', 'ヴェルデ共和国', 'ノクス帝国', 'セレス自治領'],
    relations: [
      { from: 'ルメリア連邦', to: 'アルカディア王国', status: '同盟', score: 92, note: '文化交流協定・相互防衛協議中' },
      { from: 'ルメリア連邦', to: 'ヴェルデ共和国', status: '友好', score: 74, note: '貿易港整備への投資を検討' },
      { from: 'ルメリア連邦', to: 'ノクス帝国', status: '緊張', score: 28, note: '北方演習をめぐり抗議声明' },
      { from: 'ルメリア連邦', to: 'セレス自治領', status: '中立', score: 55, note: '公式接触は限定的' },
      { from: 'アルカディア王国', to: 'ヴェルデ共和国', status: '友好', score: 70, note: '人道支援物資の輸送で協力' },
      { from: 'アルカディア王国', to: 'ノクス帝国', status: '警戒', score: 38, note: '軍事演習への説明要求' },
      { from: 'アルカディア王国', to: 'セレス自治領', status: '友好', score: 66, note: '教育・医療分野で交流' },
      { from: 'ヴェルデ共和国', to: 'ノクス帝国', status: '中立', score: 50, note: '交易は継続、政治距離は維持' },
      { from: 'ヴェルデ共和国', to: 'セレス自治領', status: '同盟', score: 88, note: '共同港湾警備協定' },
      { from: 'ノクス帝国', to: 'セレス自治領', status: '敵対', score: 14, note: '領海警備をめぐる対立' },
    ],
  },
};

const state = {
  news: [],
  diplomacy: { nations: [], relations: [] },
  categories: new Set(),
  gasUrl: localStorage.getItem(LS_GAS_URL) || '',
};

const relationStyles = {
  '同盟': { color: '#77c67a', label: '同盟' },
  '友好': { color: '#9fd36d', label: '友好' },
  '中立': { color: '#e8d5a3', label: '中立' },
  '警戒': { color: '#e3a14f', label: '警戒' },
  '緊張': { color: '#df8a63', label: '緊張' },
  '敵対': { color: '#df6b63', label: '敵対' },
  '不明': { color: '#8f998d', label: '不明' },
};

const $ = (selector) => document.querySelector(selector);

window.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  $('#gasUrlInput').value = state.gasUrl;
  updateGasStatus();
  await loadData();
}

function bindEvents() {
  $('#searchNews').addEventListener('input', renderNews);
  $('#categoryFilter').addEventListener('change', renderNews);
  $('#focusNation').addEventListener('change', renderMatrix);
  $('#openSettings').addEventListener('click', openSettings);
  $('#closeSettings').addEventListener('click', () => $('#settingsDialog').close());
  $('#settingsForm').addEventListener('submit', saveGasUrl);
  $('#clearGas').addEventListener('click', clearGasUrl);
  $('#loadSample').addEventListener('click', async () => {
    localStorage.removeItem(LS_LOCAL_NEWS);
    await loadSampleData();
    announce('サンプルデータに戻しました。');
  });
  $('#newsForm').addEventListener('submit', submitNews);
}

async function loadData() {
  if (state.gasUrl) {
    try {
      const [newsPayload, diplomacyPayload] = await Promise.all([
        fetchJson(withAction(state.gasUrl, 'getNews')),
        fetchJson(withAction(state.gasUrl, 'getDiplomacyMatrix')),
      ]);
      state.news = normalizeNews(newsPayload.news || newsPayload.items || []);
      state.diplomacy = normalizeDiplomacy(diplomacyPayload.diplomacy || diplomacyPayload);
      mergeLocalNews();
      renderAll();
      updateGasStatus('GAS接続中: データを取得できました。', 'ok');
      return;
    } catch (error) {
      console.warn(error);
      updateGasStatus('GAS URLは保存済みです。通信に失敗したため、サンプルデータを表示しています。', 'warn');
      announce('GAS通信に失敗したため、サンプルデータを表示しています。');
    }
  }
  await loadSampleData();
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (payload && payload.success === false) throw new Error(payload.error || 'GAS error');
  return payload;
}

async function loadSampleData() {
  let sample = FALLBACK_SAMPLE;
  try {
    const response = await fetch('sample-data.json', { cache: 'no-store' });
    if (response.ok) sample = await response.json();
  } catch (error) {
    console.info('sample-data.json could not be loaded; using embedded sample data.');
  }
  state.news = normalizeNews(sample.news);
  state.diplomacy = normalizeDiplomacy(sample.diplomacy);
  mergeLocalNews();
  renderAll();
}

function mergeLocalNews() {
  const localNews = JSON.parse(localStorage.getItem(LS_LOCAL_NEWS) || '[]');
  state.news = normalizeNews([...localNews, ...state.news]);
}

function normalizeNews(items) {
  return items
    .map((item, index) => ({
      id: item.id || `news-${Date.now()}-${index}`,
      date: item.date || item.createdAt || new Date().toISOString(),
      nation: item.nation || '無所属',
      author: item.author || '匿名記者',
      category: item.category || '一般',
      title: item.title || '無題のニュース',
      body: item.body || item.content || '',
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function normalizeDiplomacy(payload) {
  const nations = payload.nations || collectNations(payload.relations || []);
  return {
    nations,
    relations: (payload.relations || []).map((relation) => ({
      from: relation.from,
      to: relation.to,
      status: relation.status || '不明',
      score: Number.isFinite(Number(relation.score)) ? Number(relation.score) : 0,
      note: relation.note || '',
    })),
  };
}

function collectNations(relations) {
  return [...new Set(relations.flatMap((relation) => [relation.from, relation.to]).filter(Boolean))];
}

function renderAll() {
  state.categories = new Set(state.news.map((item) => item.category));
  renderCategoryOptions();
  renderStats();
  renderNews();
  renderMatrixControls();
  renderLegend();
  renderMatrix();
}

function renderStats() {
  $('#statNews').textContent = state.news.length;
  $('#statNations').textContent = state.diplomacy.nations.length;
  $('#statUpdated').textContent = state.news[0] ? formatShortDate(state.news[0].date) : '--';
}

function renderCategoryOptions() {
  const select = $('#categoryFilter');
  const current = select.value;
  select.innerHTML = '<option value="all">すべて</option>';
  [...state.categories].sort().forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.append(option);
  });
  select.value = [...state.categories].has(current) ? current : 'all';
}

function renderNews() {
  const query = $('#searchNews').value.trim().toLowerCase();
  const category = $('#categoryFilter').value;
  const items = state.news.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const haystack = `${item.title} ${item.body} ${item.nation} ${item.author}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });

  const grid = $('#newsGrid');
  const template = $('#newsCardTemplate');
  grid.innerHTML = '';
  items.forEach((item) => {
    const card = template.content.cloneNode(true);
    card.querySelector('.badge').textContent = item.category;
    card.querySelector('time').textContent = formatDate(item.date);
    card.querySelector('h3').textContent = item.title;
    card.querySelector('.body').textContent = item.body;
    card.querySelector('.nation').textContent = item.nation;
    card.querySelector('.author').textContent = `by ${item.author}`;
    grid.append(card);
  });
  $('#newsEmpty').hidden = items.length > 0;
  $('#headlineTicker').textContent = items[0]
    ? `最新: ${items[0].nation} / ${items[0].title}`
    : 'ニュースはまだありません。';
}

function renderMatrixControls() {
  const select = $('#focusNation');
  const current = select.value;
  select.innerHTML = '<option value="all">全国家を表示</option>';
  state.diplomacy.nations.forEach((nation) => {
    const option = document.createElement('option');
    option.value = nation;
    option.textContent = `${nation}を中心に表示`;
    select.append(option);
  });
  select.value = state.diplomacy.nations.includes(current) ? current : 'all';
}

function renderLegend() {
  const legend = $('#legend');
  legend.innerHTML = '';
  Object.values(relationStyles).forEach((style) => {
    const item = document.createElement('span');
    item.innerHTML = `<i style="background:${style.color}"></i>${style.label}`;
    legend.append(item);
  });
}

function renderMatrix() {
  const focus = $('#focusNation').value;
  const nations = focus === 'all'
    ? state.diplomacy.nations
    : state.diplomacy.nations.filter((nation) => nation === focus || findRelation(focus, nation).status !== '不明');
  const table = $('#matrixTable');
  table.innerHTML = '';

  const thead = table.createTHead();
  const headRow = thead.insertRow();
  headRow.append(document.createElement('th'));
  nations.forEach((nation) => {
    const th = document.createElement('th');
    th.textContent = nation;
    headRow.append(th);
  });

  const tbody = table.createTBody();
  nations.forEach((from) => {
    const row = tbody.insertRow();
    const rowHead = row.insertCell();
    rowHead.textContent = from;
    nations.forEach((to) => {
      const cell = row.insertCell();
      if (from === to) {
        cell.textContent = '自国';
        cell.className = 'self';
        return;
      }
      const relation = findRelation(from, to);
      const style = relationStyles[relation.status] || relationStyles['不明'];
      const button = document.createElement('button');
      button.style.background = `linear-gradient(135deg, ${style.color}, ${mixWithWhite(style.color)})`;
      button.innerHTML = `${relation.status}<small>${relation.score}</small>`;
      button.addEventListener('click', () => showRelationDetail(from, to, relation));
      cell.append(button);
    });
  });
}

function findRelation(from, to) {
  return state.diplomacy.relations.find((relation) =>
    (relation.from === from && relation.to === to) || (relation.from === to && relation.to === from)
  ) || { from, to, status: '不明', score: 0, note: '関係データが未登録です。' };
}

function showRelationDetail(from, to, relation) {
  $('#relationDetail').innerHTML = `
    <strong>${from} × ${to}</strong>
    <span>関係: ${relation.status} / スコア: ${relation.score}</span>
    <span>${relation.note || '備考はありません。'}</span>
  `;
}

async function submitNews(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const item = {
    id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
    date: new Date().toISOString(),
    ...data,
  };

  if (state.gasUrl) {
    try {
      const response = await fetch(state.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'postNews', news: item }),
      });
      const payload = await response.json();
      if (payload.success === false) throw new Error(payload.error || '投稿に失敗しました');
      announce('スプレッドシートに投稿しました。');
    } catch (error) {
      saveLocalNews(item);
      announce('GAS投稿に失敗したため、この端末に保存しました。');
    }
  } else {
    saveLocalNews(item);
    announce('この端末にニュースを保存しました。');
  }

  form.reset();
  state.news = normalizeNews([item, ...state.news]);
  renderAll();
}

function saveLocalNews(item) {
  const items = JSON.parse(localStorage.getItem(LS_LOCAL_NEWS) || '[]');
  localStorage.setItem(LS_LOCAL_NEWS, JSON.stringify([item, ...items].slice(0, 100)));
}

function openSettings() {
  $('#gasUrlInput').value = state.gasUrl;
  updateGasStatus();
  $('#settingsDialog').showModal();
}

async function saveGasUrl(event) {
  event.preventDefault();
  const url = normalizeGasUrl($('#gasUrlInput').value);
  if (!url) {
    updateGasStatus('GAS URLを入力してください。', 'error');
    return;
  }

  state.gasUrl = url;
  localStorage.setItem(LS_GAS_URL, url);
  $('#gasUrlInput').value = url;
  updateGasStatus('GAS URLを保存しました。接続を確認しています...', 'ok');
  announce('GAS URLを保存しました。');
  await loadData();
  $('#settingsDialog').close();
}

function normalizeGasUrl(value) {
  return value.trim().replace(/^<|>$/g, '');
}

function withAction(baseUrl, action) {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}action=${encodeURIComponent(action)}`;
}

function updateGasStatus(message, type = '') {
  const status = $('#gasStatus');
  if (!status) return;
  status.textContent = message || (state.gasUrl
    ? `保存中のURL: ${state.gasUrl}`
    : 'GAS URLは未設定です。未設定でもサンプル表示と端末内投稿は使えます。');
  status.dataset.type = type;
}

function clearGasUrl() {
  state.gasUrl = '';
  $('#gasUrlInput').value = '';
  localStorage.removeItem(LS_GAS_URL);
  updateGasStatus('GAS URL設定を削除しました。', 'warn');
  $('#settingsDialog').close();
  loadData();
}

function announce(message) {
  $('#postStatus').textContent = message;
  setTimeout(() => {
    if ($('#postStatus').textContent === message) $('#postStatus').textContent = '';
  }, 4200);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('ja-JP', { month: '2-digit', day: '2-digit' }).format(new Date(date));
}

function mixWithWhite(hex) {
  const value = hex.replace('#', '');
  const r = Math.round(parseInt(value.slice(0, 2), 16) * 0.72 + 255 * 0.28);
  const g = Math.round(parseInt(value.slice(2, 4), 16) * 0.72 + 255 * 0.28);
  const b = Math.round(parseInt(value.slice(4, 6), 16) * 0.72 + 255 * 0.28);
  return `rgb(${r}, ${g}, ${b})`;
}
