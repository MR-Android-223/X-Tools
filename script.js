let placeholderText =
'اضغط توليد...';

document.getElementById('emailOutput').placeholder = placeholderText;
document.getElementById('passOutput').placeholder = placeholderText;
document.getElementById('userOutput').placeholder = placeholderText;

let selectedDomain = 'gmail.com';
let selectedStyle = 'cool';
let historyData = JSON.parse(localStorage.getItem('abuFaizHistory')) || [];
let stats = JSON.parse(localStorage.getItem('abuFaizStats')) || { generated: 0, copied: 0 };
let savedTempEmails = JSON.parse(localStorage.getItem('abuFaizTempEmails')) || [];
let savedMsgData = JSON.parse(localStorage.getItem('abuFaizMsgData')) || {};
let sessionStart = Date.now();
let currentToken = '';
let inboxInterval;
let currentModalToken = '';
let currentModalEmail = '';
const apiUrl = 'https://api.mail.gw';
let isGenerating = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('totalGenerated').textContent = stats.generated;
  document.getElementById('totalCopied').textContent = stats.copied;
  renderHistory();
  renderSavedEmails();
});

setInterval(() => {
  const mins = Math.floor((Date.now() - sessionStart) / 60000);
  let minStr = mins + 'm';
  document.getElementById('sessionTime').textContent = minStr;
}, 10000);

function saveStats() {
  localStorage.setItem('abuFaizStats', JSON.stringify(stats));
}

function selectDomain(btn, domain) {
  document.querySelectorAll('.domain-btn').forEach(b => {
    b.classList.remove('active');
  });
  btn.classList.add('active');
  selectedDomain = domain;

  const genBtn = document.getElementById('genEmailBtn');
  if (genBtn) {
    if (domain === 'tempmail') {
      let liveText = 
      'توليد بريد حي';
      
      genBtn.innerHTML = '<span>⚡</span> ' + liveText;
      genBtn.style.background = 'linear-gradient(135deg, #00e676, #00b248)';
    } else {
      let normalText = 
      'توليد إيميل';
      
      genBtn.innerHTML = '<span>⚡</span> ' + normalText;
      genBtn.style.background = '';
    }
  }
}

function selectStyle(btn, style) {
  document.querySelectorAll('.style-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedStyle = style;
}

function toggleOption(el) {
  el.classList.toggle('checked');
  const box = el.querySelector('.toggle-box');
  let checkMark = el.classList.contains('checked') ? '✓' : '';
  box.textContent = checkMark;
}

function addRipple(btn, e) {
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  let rippleStyle = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX-rect.left-size/2) + 'px;top:' + (e.clientY-rect.top-size/2) + 'px';
  ripple.style.cssText = rippleStyle;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 700);
}

function showToast(msg, emoji = '✅') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast success';
  let toastHtml = '<span>' + emoji + '</span> ' + msg;
  toast.innerHTML = toastHtml;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function addHistory(value, typeKey) {
  historyData.unshift({ value: value, type: typeKey, time: new Date().toLocaleTimeString('en-US') });
  if (historyData.length > 50) historyData.pop();
  localStorage.setItem('abuFaizHistory', JSON.stringify(historyData));
  renderHistory();
  stats.generated++;
  document.getElementById('totalGenerated').textContent = stats.generated;
  saveStats();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (historyData.length === 0) {
    let emptyMsg =
    'لا يوجد سجل بعد...';
    list.innerHTML = '<div class="empty-history">' + emptyMsg + '</div>';
    return;
  }
  
  let htmlResult = '';
  historyData.forEach((item, i) => {
    let typeStr = '';
    if(item.type === 'email') {
      typeStr =
      'إيميل';
    } else if(item.type === 'pass') {
      typeStr =
      'سر';
    } else {
      typeStr =
      'مستخدم';
    }
    
    let safeValue = item.value.replace(/'/g,"\\'");
    let animStyle = 'animation-delay:' + (i*0.03) + 's';
    
    htmlResult += '<div class="history-item" style="' + animStyle + '">';
    htmlResult += '<div class="history-value">' + item.value + '</div>';
    htmlResult += '<span class="history-badge badge-' + item.type + '">' + typeStr + '</span>';
    htmlResult += '<button class="history-copy" onclick="copyRaw(\'' + safeValue + '\')">📋</button>';
    htmlResult += '</div>';
  });
  list.innerHTML = htmlResult;
}

function askClearHistory() {
  document.getElementById('confirmModal').classList.add('active');
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('active');
}

function confirmClearHistory() {
  historyData = [];
  localStorage.removeItem('abuFaizHistory');
  renderHistory();
  closeModal();
  let msgClear =
  'تم مسح السجل بنجاح';
  showToast(msgClear, '🗑️');
}

async function copyRaw(text) {
  try {
    await navigator.clipboard.writeText(text);
    let msgCopied =
    'تم النسخ!';
    showToast(msgCopied);
    stats.copied++;
    document.getElementById('totalCopied').textContent = stats.copied;
    saveStats();
  } catch (err) {}
}

async function copyField(fieldId, btnId) {
  const field = document.getElementById(fieldId);
  if (!field.value) { 
    let msgEmpty =
    'لا يوجد شيء للنسخ';
    showToast(msgEmpty, '⚠️'); 
    return; 
  }
  await copyRaw(field.value);
  const btn = document.getElementById(btnId);
  btn.classList.add('copied');
  btn.querySelector('span').textContent = '✅';
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.querySelector('span').textContent = '📋';
  }, 2000);
}

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

function shuffle(str) {
  return str.split('').sort(() => 0.5 - Math.random()).join('');
}

function sanitizeHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const badTags = ['script', 'iframe', 'object', 'embed', 'form', 'meta', 'link', 'style', 'base'];
  badTags.forEach(tag => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    for (let i = el.attributes.length - 1; i >= 0; i--) {
      const attr = el.attributes[i];
      if (attr.name.toLowerCase().startsWith('on') || attr.value.toLowerCase().includes('javascript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

async function generateEmail(btn, e) {
  if (isGenerating) return;
  if (btn && e) addRipple(btn, e);

  const field = document.getElementById('emailOutput');
  const inboxContainer = document.getElementById('inboxContainer');
  const inboxList = document.getElementById('inboxList');

  const adjectives = [
    'dark', 'blue', 'fire', 'swift', 'cool', 'epic', 'star', 'nova', 'iron', 'wild', 'sky', 'zen',
    'toxic', 'neon', 'shadow', 'crystal', 'quantum', 'cosmic', 'phantom', 'silent', 'golden',
    'silver', 'crimson', 'emerald', 'sapphire', 'frozen', 'blazing', 'mystic', 'ancient',
    'digital', 'virtual', 'brave', 'bold', 'clever', 'fast', 'super', 'mega', 'ultra', 'hyper',
    'giga', 'alpha', 'omega', 'prime', 'elite', 'supreme', 'royal', 'magic', 'secret', 'hidden',
    'lost', 'last', 'first', 'zero', 'infinite', 'crazy', 'mad', 'smart', 'genius', 'darkness',
    'light', 'heavy', 'rapid', 'sonic', 'atomic', 'nuclear', 'solar', 'lunar', 'stellar',
    'astral', 'chaos', 'order', 'chaos', 'doom', 'glory', 'honor', 'power', 'force', 'energy'
  ];
  
  const nouns = [
    'wolf', 'hawk', 'lion', 'dragon', 'ghost', 'shadow', 'blade', 'storm', 'void', 'pixel', 'cyber', 'nexus',
    'tiger', 'bear', 'eagle', 'falcon', 'shark', 'viper', 'cobra', 'ninja', 'samurai', 'knight', 'wizard',
    'mage', 'hunter', 'ranger', 'rogue', 'thief', 'assassin', 'king', 'queen', 'prince', 'lord', 'god',
    'demon', 'angel', 'spirit', 'soul', 'heart', 'mind', 'brain', 'system', 'network', 'matrix', 'code',
    'data', 'byte', 'bot', 'mech', 'cyborg', 'alien', 'mutant', 'hero', 'villain', 'titan', 'giant', 'beast',
    'monster', 'warrior', 'fighter', 'soldier', 'sniper', 'pilot', 'driver', 'rider', 'racer', 'runner'
  ];

  if (selectedDomain === 'tempmail') {
    isGenerating = true;
    inboxContainer.style.display = 'block';
    
    let msgCreating = 
    'جاري إنشاء إيميل...';
    
    field.value = msgCreating;
    field.classList.remove('has-value');
    
    let msgWaiting = 
    'جاري تجهيز الصندوق...';
    
    inboxList.innerHTML = '<div class="empty-inbox">' + msgWaiting + '</div>';

    const username = adjectives[Math.floor(Math.random() * adjectives.length)] + '_' + nouns[Math.floor(Math.random() * nouns.length)] + Math.floor(Math.random() * 999);

    try {
      const domainRes = await fetch(apiUrl + '/domains');
      const domainData = await domainRes.json();
      const domain = domainData['hydra:member'][0].domain;

      const email = username + '@' + domain;
      const password = 'P@ss_' + Math.random().toString(36).substring(2, 10) + '!';

      await fetch(apiUrl + '/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: email, password: password })
      });

      const tokenRes = await fetch(apiUrl + '/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: email, password: password })
      });
      
      const tokenData = await tokenRes.json();
      currentToken = tokenData.token;

      field.value = email;
      field.classList.add('has-value');
      addHistory(email, 'email');

      savedTempEmails.unshift({ email: email, token: currentToken });
      localStorage.setItem('abuFaizTempEmails', JSON.stringify(savedTempEmails));
      renderSavedEmails();

      let msgReady = 
      'بانتظار الرسائل الجديدة...';
      
      inboxList.innerHTML = '<div class="empty-inbox">' + msgReady + '</div>';

      if (inboxInterval) clearInterval(inboxInterval);
      inboxInterval = setInterval(checkRealInbox, 5000);

      let msgSuccess = 
      'تم توليد إيميل مؤقت!';
      
      showToast(msgSuccess, '📧');

    } catch (error) {
      let msgFail = 
      'فشل الاتصال بالخادم';
      
      field.value = msgFail;
      
      let msgNet = 
      'تأكد من اتصالك بالإنترنت';
      
      inboxList.innerHTML = '<div class="empty-inbox">' + msgNet + '</div>';
    } finally {
      isGenerating = false;
    }

  } else {
    inboxContainer.style.display = 'none';
    if (inboxInterval) clearInterval(inboxInterval);

    const patterns = [
      () => rand(adjectives) + rand(nouns) + randInt(10, 9999),
      () => rand(adjectives) + '_' + rand(nouns) + randInt(1, 999),
      () => rand(nouns) + '.' + rand(adjectives) + randInt(10, 9999),
      () => shuffle('abcdefghijklmnopqrstuvwxyz'.substring(0, randInt(5,9))) + randInt(100, 99999),
      () => rand(adjectives) + randInt(10000, 99999),
      () => rand(nouns) + rand(nouns) + randInt(1, 99)
    ];

    const username = rand(patterns)();
    
    let targetDomain = selectedDomain;
    if (targetDomain === 'random') {
      const rDoms = ['gmail.com', 'hotmail.com', 'yahoo.com', 'proton.me', 'outlook.com', 'icloud.com', 'mail.com'];
      targetDomain = rand(rDoms);
    }

    const email = username + '@' + targetDomain;
    
    field.value = email;
    field.classList.add('has-value');
    addHistory(email, 'email');
    
    let msgGenEmail = 
    'تم توليد إيميل جديد!';
    
    showToast(msgGenEmail, '📧');
  }
}

async function checkRealInbox() {
    if (!currentToken) return;
    if (document.getElementById('readingEmail')) return;

    try {
        const res = await fetch(apiUrl + '/messages', {
            headers: { 'Authorization': 'Bearer ' + currentToken }
        });
        const data = await res.json();
        const messages = data['hydra:member'];

        const inboxList = document.getElementById('inboxList');

        if (messages.length === 0) return;

        let htmlContent = '';
        
        let noSubject = 
        'بدون موضوع';
        
        let fromLabel = 
        'من: ';

        messages.forEach(msg => {
            let msgSubj = msg.subject || noSubject;
            let msgFrom = msg.from.address;
            let dateStr = new Date(msg.createdAt).toLocaleTimeString();
            
            htmlContent += '<div class="email-message" onclick="readRealMessage(\'' + msg.id + '\')">';
            htmlContent += '<div class="email-subject">' + msgSubj + '</div>';
            htmlContent += '<div class="email-sender">';
            htmlContent += fromLabel;
            htmlContent += msgFrom;
            htmlContent += ' - ' + dateStr;
            htmlContent += '</div></div>';
        });

        inboxList.innerHTML = htmlContent;

    } catch (error) {
        console.log(error);
    }
}

async function readRealMessage(msgId) {
    const inboxList = document.getElementById('inboxList');
    
    let msgOpening = 
    'جاري فتح الرسالة...';
    
    inboxList.innerHTML = '<div class="empty-inbox">' + msgOpening + '</div>';

    try {
        const res = await fetch(apiUrl + '/messages/' + msgId, {
            headers: { 'Authorization': 'Bearer ' + currentToken }
        });
        const msgData = await res.json();

        let emptyMsg = 
        'الرسالة فارغة';
        
        const rawContent = msgData.html ? msgData.html[0] : (msgData.text || emptyMsg);
        const cleanContent = sanitizeHTML(rawContent);
        const safeHtml = cleanContent.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
        
        let backLabel = 
        'الرجوع للصندوق';

        let readingHtml = '<div id="readingEmail" style="height:100%; display:flex; flex-direction:column;">';
        readingHtml += '<button class="btn-back-inbox" onclick="backToRealInbox()" style="flex-shrink:0;">⬅️ ' + backLabel + '</button>';
        readingHtml += '<iframe sandbox="allow-same-origin" srcdoc="' + safeHtml + '" class="email-body-view" style="flex:1; width:100%; border:none; background:#fff;"></iframe>';
        readingHtml += '</div>';
        
        inboxList.innerHTML = readingHtml;
        
    } catch (error) {
        let errorMsg = 
        'خطأ بفتح الرسالة';
        
        inboxList.innerHTML = '<div class="empty-inbox">' + errorMsg + '</div>';
        setTimeout(backToRealInbox, 2000);
    }
}

function backToRealInbox() {
    let msgUpdating = 
    'جاري التحديث...';
    
    document.getElementById('inboxList').innerHTML = '<div class="empty-inbox">' + msgUpdating + '</div>';
    checkRealInbox();
}

function generatePass(btn, e) {
  if (btn && e) addRipple(btn, e);

  const options = document.querySelectorAll('#passOptions .option-toggle');
  const upper = options[0].classList.contains('checked') ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '';
  const lower = options[1].classList.contains('checked') ? 'abcdefghijklmnopqrstuvwxyz' : '';
  const nums  = options[2].classList.contains('checked') ? '0123456789' : '';
  const syms  = options[3].classList.contains('checked') ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '';

  const all = upper + lower + nums + syms;
  if (!all) { 
    let msgNoType =
    'اختر نوع واحد على الأقل!';
    showToast(msgNoType, '⚠️'); 
    return; 
  }

  const length = parseInt(document.getElementById('passLength').value);
  let pass = '';

  if (upper) pass += rand(upper);
  if (lower) pass += rand(lower);
  if (nums)  pass += rand(nums);
  if (syms)  pass += rand(syms);

  while (pass.length < length) pass += rand(all);
  if (pass.length > length) pass = pass.substring(0, length);
  pass = shuffle(pass);

  const field = document.getElementById('passOutput');
  field.value = pass;
  field.classList.add('has-value');

  updateStrength(pass, upper, lower, nums, syms);
  addHistory(pass, 'pass');
  
  let msgGenPass =
  'تم توليد كلمة سر قوية! 🔐';
  showToast(msgGenPass);
}

function updateStrength(pass, upper, lower, nums, syms) {
  let score = 0;
  if (pass.length >= 12) score += 25;
  if (pass.length >= 20) score += 15;
  if (upper) score += 15;
  if (lower) score += 15;
  if (nums)  score += 15;
  if (syms)  score += 15;

  const fill = document.getElementById('strengthFill');
  const text = document.getElementById('strengthText');

  fill.style.width = score + '%';
  
  let txt1 =
  'ضعيفة ⚠️';
  let txt2 =
  'متوسطة ⚡';
  let txt3 =
  'قوية 💪';
  let txt4 =
  'لا تكسر! 🔥';

  if (score < 40) {
    fill.style.background = '#ff3d71';
    text.style.color = '#ff3d71';
    text.textContent = txt1;
  } else if (score < 70) {
    fill.style.background = '#ffd700';
    text.style.color = '#ffd700';
    text.textContent = txt2;
  } else if (score < 90) {
    fill.style.background = '#00e676';
    text.style.color = '#00e676';
    text.textContent = txt3;
  } else {
    fill.style.background = 'linear-gradient(90deg, #00d4ff, #00e676)';
    text.style.color = '#00d4ff';
    text.textContent = txt4;
  }
}

function generateUsername(btn, e) {
  if (btn && e) addRipple(btn, e);

  const styles = {
    cool: [
      () => ['dark','epic','ultra','hyper','neo','alpha','omega','meta','cyber','neon','quantum','cosmic','astral','void','flux'][randInt(0,14)] + ['Wolf','Hawk','Fox','Viper','Ghost','Blade','Storm','Nexus','Core','Void','Pulse','Spark','Flare','Sync','Grid'][randInt(0,14)],
      () => 'x_' + ['hunter','sniper','driv3r','coderr','hack3r','nod3r','kill3r','slay3r','play3r','gam3r','mast3r','lord','king','boss'][randInt(0,13)] + '_x',
      () => ['shadow','phantom','spectr','cipher','zenith','apex','vortex','matrix','system','logic','pixel','byte'][randInt(0,11)] + randInt(100,9999),
      () => ['TheReal','Just','Only','True','Pure','Absolute','Infinite'][randInt(0,6)] + ['Legend','Myth','Icon','Hero','Champ','Star'][randInt(0,5)] + randInt(1,99)
    ],
    gamer: [
      () => ['xX','XX','gg','Ez','Pro','God'][randInt(0,5)] + ['Noob','Killer','Sniper','Boss','Slayer','Hunter','Beast','Titan','Ninja','Samurai','Demon','Dragon'][randInt(0,11)] + ['Xx','XX','_YT','_TV','TTV'][randInt(0,4)],
      () => ['ProPlayer','MLGpro','TopFrag','AceKill','OneShot','HeadShot','Clutch','Carry','Rush','Camp','Loot'][randInt(0,10)] + randInt(100,9999),
      () => ['N3on','Ph4ntom','Vip3r','Gh0st','Fr0st','Bl4ze','Ven0m','T0xic','H4v0c','R3c0n'][randInt(0,9)] + '_' + ['GG','YT','TV','PRO','GOD','MVP'][randInt(0,5)],
      () => ['FaZe_','OpTic_','TSM_','C9_','G2_','Navi_'][randInt(0,5)] + ['Aim','Flick','Spray','Peek','Push'][randInt(0,4)] + randInt(1,99)
    ],
    pro: [
      () => ['Alex','Ryan','Sam','Kyle','Drew','Max','John','Mike','Chris','David','James','Tom'][randInt(0,11)] + ['Dev','Tech','Pro','Hub','Lab','Studio','Code','Web','App','Net'][randInt(0,9)] + randInt(10,999),
      () => ['the','mr_','sir_','dr_','real_'][randInt(0,4)] + ['dev','coder','builder','maker','creator','founder','admin','root','sys','hacker'][randInt(0,9)],
      () => ['dev','tech','code','build','stack','data','cloud'][randInt(0,6)] + ['_' + ['io','hub','xyz','app','co','net','org'][randInt(0,6)]],
      () => ['Code','Byte','Bit','Data','Logic','Loop','Node','Script'][randInt(0,7)] + ['Master','Ninja','Guru','Wizard','Jedi','Geek'][randInt(0,5)] + randInt(1,99)
    ],
    arabic: [
      () => ['abu','om','bnt','ibn','akh','okht'][randInt(0,5)] + '_' + ['faiz','nour','ali','sara','reem','lara','ahmad','omar','tariq','rami','sami','fadi'][randInt(0,11)] + randInt(0,999),
      () => ['alqamar','alnoor','alsayf','alward','albadr','alahly','alshams','alnajm','alfajer','allayl','alassad','alnimr'][randInt(0,11)] + randInt(10,9999),
      () => ['malik','amir','batal','qaid','nokhba','zaeem','sheikh','pasha','bek','muallem','ostaz','wahsh'][randInt(0,11)] + '_' + randInt(100,9999),
      () => ['Syrian','Sham','Halabi','Homsi','Dimashqi','Arab'][randInt(0,5)] + ['King','Prince','Boss','Pro','Gamer'][randInt(0,4)] + randInt(1,99)
    ],
    random: null,
  };

  let username;
  if (selectedStyle === 'random') {
    const allStyles = Object.values(styles).filter(s => s);
    const picked = rand(allStyles);
    username = rand(picked)();
  } else {
    username = rand(styles[selectedStyle])();
  }

  const field = document.getElementById('userOutput');
  field.value = username;
  field.classList.add('has-value');
  addHistory(username, 'user');
  
  let msgGenUser =
  'تم توليد اسم مستخدم! ✨';
  showToast(msgGenUser);
}

function renderSavedEmails() {
  const list = document.getElementById('savedEmailsList');
  if (savedTempEmails.length === 0) {
    let emptyMsg =
    'لا يوجد إيميلات محفوظة بعد...';
    list.innerHTML = '<div class="empty-history">' + emptyMsg + '</div>';
    return;
  }
  
  let htmlResult = '';
  let copyLabel = 
  '📋 نسخ';

  savedTempEmails.forEach((item, i) => {
    let safeEmail = item.email.replace(/'/g,"\\'");
    let safeToken = item.token.replace(/'/g,"\\'");
    
    htmlResult += '<div class="saved-email-item" style="cursor:default;">';
    htmlResult += '<div class="saved-email-text" style="cursor:pointer;" onclick="openSavedEmail(\'' + safeEmail + '\', \'' + safeToken + '\')">' + item.email + '</div>';
    htmlResult += '<button class="saved-email-copy" onclick="copyRaw(\'' + safeEmail + '\')">' + copyLabel + '</button>';
    htmlResult += '</div>';
  });
  list.innerHTML = htmlResult;
}

function openSavedEmail(email, token) {
  document.getElementById('savedEmailTitle').textContent = email;
  document.getElementById('savedEmailModal').classList.add('active');
  
  currentModalToken = token;
  currentModalEmail = email;
  
  let msgFetching = 
  'جاري جلب الرسائل...';
  
  document.getElementById('savedInboxList').innerHTML = '<div class="empty-inbox">' + msgFetching + '</div>';
  
  fetchSavedMessages();
}

function closeSavedModal() {
  document.getElementById('savedEmailModal').classList.remove('active');
  currentModalToken = '';
  currentModalEmail = '';
}

async function fetchSavedMessages() {
  if (!currentModalToken) return;
  if (document.getElementById('readingSavedEmail')) return;

  const inboxList = document.getElementById('savedInboxList');
  let localMsgs = savedMsgData[currentModalEmail] || {};

  try {
      const res = await fetch(apiUrl + '/messages', {
          headers: { 'Authorization': 'Bearer ' + currentModalToken }
      });
      const data = await res.json();
      const apiMessages = data['hydra:member'] || [];

      let combined = [];
      let seenIds = new Set();

      apiMessages.forEach(msg => {
          combined.push(msg);
          seenIds.add(msg.id);
      });

      Object.values(localMsgs).forEach(localMsg => {
          if (!seenIds.has(localMsg.id)) {
              combined.push(localMsg);
              seenIds.add(localMsg.id);
          }
      });

      combined.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

      if (combined.length === 0) {
          let emptySaved = 
          'لا يوجد رسائل في هذا الصندوق.';
          inboxList.innerHTML = '<div class="empty-inbox">' + emptySaved + '</div>';
          return;
      }

      let htmlContent = '';
      let noSubject = 
      'بدون موضوع';
      let fromLabel = 
      'من: ';

      combined.forEach(msg => {
          let msgSubj = msg.subject || noSubject;
          let msgFrom = msg.from ? msg.from.address : (msg.fromAddress || 'غير معروف');
          let dateVal = msg.createdAt || msg.date;
          let dateStr = new Date(dateVal).toLocaleTimeString();
          
          let badgeText = 
          '[محفوظة] ';
          let badgeHtml = seenIds.has(msg.id) && !apiMessages.find(m=>m.id === msg.id) ? '<span style="color:#00e676;font-size:10px;">' + badgeText + '</span> ' : '';

          htmlContent += '<div class="email-message" onclick="readSavedMessage(\'' + msg.id + '\')">';
          htmlContent += '<div class="email-subject">' + badgeHtml + msgSubj + '</div>';
          htmlContent += '<div class="email-sender">' + fromLabel + msgFrom + ' - ' + dateStr + '</div></div>';
      });

      inboxList.innerHTML = htmlContent;

  } catch (error) {
      let combined = Object.values(localMsgs);
      combined.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (combined.length === 0) {
          let msgDel = 
          'الحساب محذوف من الخادم ولا يوجد رسائل محفوظة محلياً.';
          inboxList.innerHTML = '<div class="empty-inbox">' + msgDel + '</div>';
          return;
      }

      let msgWarning = 
      'نعرض الرسائل المحفوظة بذاكرة المتصفح فقط';
      let htmlContent = '<div style="color:#00e676;font-size:12px;margin-bottom:10px;text-align:center;">' + msgWarning + '</div>';
      
      combined.forEach(msg => {
          let msgSubj = msg.subject || 'بدون موضوع';
          let msgFrom = msg.fromAddress || 'غير معروف';
          let dateStr = new Date(msg.date).toLocaleTimeString();

          htmlContent += '<div class="email-message" onclick="readSavedMessage(\'' + msg.id + '\')">';
          htmlContent += '<div class="email-subject">' + msgSubj + '</div>';
          htmlContent += '<div class="email-sender">من: ' + msgFrom + ' - ' + dateStr + '</div></div>';
      });
      inboxList.innerHTML = htmlContent;
  }
}

async function readSavedMessage(msgId) {
    const inboxList = document.getElementById('savedInboxList');
    
    let msgOpening = 
    'جاري فتح الرسالة...';
    
    inboxList.innerHTML = '<div class="empty-inbox">' + msgOpening + '</div>';

    let localMsgs = savedMsgData[currentModalEmail] || {};
    let localMsg = localMsgs[msgId];
    let bodyContent = '';

    try {
        const res = await fetch(apiUrl + '/messages/' + msgId, {
            headers: { 'Authorization': 'Bearer ' + currentModalToken }
        });
        
        if (!res.ok) throw new Error('Not found');
        
        const msgData = await res.json();

        let emptyMsg = 
        'الرسالة فارغة';
        
        bodyContent = msgData.html ? msgData.html[0] : (msgData.text || emptyMsg);
        
        if (!savedMsgData[currentModalEmail]) savedMsgData[currentModalEmail] = {};
        savedMsgData[currentModalEmail][msgId] = {
            id: msgData.id,
            subject: msgData.subject,
            fromAddress: msgData.from.address,
            date: msgData.createdAt,
            bodyContent: bodyContent
        };
        localStorage.setItem('abuFaizMsgData', JSON.stringify(savedMsgData));
        
    } catch (error) {
        if (localMsg && localMsg.bodyContent) {
            bodyContent = localMsg.bodyContent;
        } else {
            let msgLost = 
            'الرسالة محذوفة ولم تقم بفتحها مسبقاً لحفظها!';
            inboxList.innerHTML = '<div class="empty-inbox">' + msgLost + '</div>';
            setTimeout(backToSavedInbox, 2500);
            return;
        }
    }

    const cleanContent = sanitizeHTML(bodyContent);
    let safeHtml = cleanContent.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
    let backLabel = 
    'الرجوع للصندوق';

    let readingHtml = '<div id="readingSavedEmail" style="height:100%; display:flex; flex-direction:column;">';
    readingHtml += '<button class="btn-back-inbox" onclick="backToSavedInbox()" style="flex-shrink:0;">⬅️ ' + backLabel + '</button>';
    readingHtml += '<iframe sandbox="allow-same-origin" srcdoc="' + safeHtml + '" class="email-body-view" style="flex:1; width:100%; border:none; background:#fff;"></iframe>';
    readingHtml += '</div>';
    
    inboxList.innerHTML = readingHtml;
}

function backToSavedInbox() {
    let msgUpdating = 
    'جاري التحديث...';
    
    document.getElementById('savedInboxList').innerHTML = '<div class="empty-inbox">' + msgUpdating + '</div>';
    fetchSavedMessages();
}