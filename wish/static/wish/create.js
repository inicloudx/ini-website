// iNiXR AR Wish — creator page (Birthday + Thank-you).
// The wish is packed into the link's #fragment, so names/messages never reach our server.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var EVT_URL = document.body.dataset.evt;
  var VIEW_URL = { bday: document.body.dataset.view, ty: document.body.dataset.thanks };

  var KINDS = {
    bday: {
      emoji: '🎂',
      title: 'Send a 3D birthday wish',
      sub: 'Their name on a cake, a birthday song, and candles they blow out for real!',
      toLabel: 'Birthday person’s name',
      msgLabel: 'Your wish',
      waText: function (to, url) { return '🎂 ' + to + ', I sent you a birthday surprise! Tap to open 👉 ' + url; },
      chips: [
        ['English', 'Happy Birthday! 🎂 Wishing you a year full of joy, love and success!'],
        ['Fun', 'Happy Birthday my friend! Stay awesome, stay crazy 😄🎉'],
        ['தமிழ்', 'இனிய பிறந்தநாள் நல்வாழ்த்துக்கள்! 🎂 உங்கள் வாழ்வில் எல்லா மகிழ்ச்சியும் நிறையட்டும்!'],
        ['தமிழ் 2', 'பிறந்தநாள் வாழ்த்துக்கள்! 🎉 நீங்கள் நினைத்தது எல்லாம் நடக்கட்டும்!'],
        ['Tanglish', 'Happy Birthday da! 🎂 Innum neraya vayasu aagattum… treat eppo? 😄'],
      ],
    },
    ty: {
      emoji: '💖',
      title: 'Send a 3D thank-you',
      sub: 'A gift box they open — a glowing heart and “THANK YOU” rise out of it!',
      toLabel: 'Who do you want to thank?',
      msgLabel: 'Your thank-you message',
      waText: function (to, url) {
        return item.label
          ? item.emoji + ' ' + to + ', thank you for ' + item.label + '! I made you a little surprise 👉 ' + url
          : '💖 ' + to + ', I sent you a special thank-you! Tap to open 👉 ' + url;
      },
      chips: [
        ['For wishes', 'Thank you so much for the lovely wishes! 💖 You made my day special.'],
        ['Warm', 'Thank you for always being there for me. You’re amazing! 💖'],
        ['தமிழ்', 'உங்கள் அன்பான வாழ்த்துக்கு மிக்க நன்றி! 💖'],
        ['தமிழ் 2', 'என் நாளை சிறப்பாக்கியதற்கு மனமார்ந்த நன்றி! 🙏😊'],
        ['Tanglish', 'Romba thanks da! 💖 Un wish thaan best 😄'],
      ],
    },
  };

  // "Thank you for…" treats (must match ITEM_INFO in wish.js) with ready messages per treat.
  var ITEMS = [
    { key: 'heart', chip: '💖 Everything', label: '', emoji: '💖' },
    { key: 'meals', chip: '🍛 Home food', label: 'the delicious food', emoji: '🍛', msgs: [
      ['English', 'Thank you for the delicious food! 🍛 Your cooking is the best in the world!'],
      ['Tanglish', 'Saapadu semma taste! 🍛 Romba thanks ma! 😋'],
      ['தமிழ்', 'சுவையான சாப்பாட்டுக்கு மிக்க நன்றி! 🍛❤️'],
    ] },
    { key: 'biryani', chip: '🍚 Biryani', label: 'the biryani', emoji: '😋', msgs: [
      ['English', 'That biryani was out of this world! 😋 Thank you so much!'],
      ['Tanglish', 'Biryani vera level! 😋 Romba thanks!'],
      ['தமிழ்', 'அருமையான பிரியாணிக்கு மிக்க நன்றி! 😋'],
    ] },
    { key: 'dosa', chip: '😋 Dosa', label: 'the crispy dosa', emoji: '😋', msgs: [
      ['English', 'Thanks for the crispy dosa! 😋 Perfect start to my day!'],
      ['Tanglish', 'Dosa semma crispy! 😋 Thanks ma!'],
      ['தமிழ்', 'சுடச்சுட தோசைக்கு மிக்க நன்றி! 😋'],
    ] },
    { key: 'chicken', chip: '🍗 Chicken', label: 'the chicken treat', emoji: '🍗', msgs: [
      ['English', 'That chicken treat was awesome! 🍗 Thank you so much!'],
      ['Tanglish', 'Chicken treat semma da! 🍗 Romba thanks!'],
      ['தமிழ்', 'சிக்கன் விருந்துக்கு மிக்க நன்றி! 🍗'],
    ] },
    { key: 'juice', chip: '🧃 Juice', label: 'the juice', emoji: '🧃', msgs: [
      ['English', 'Thanks for the juice! 🧃 So refreshing, just like you 😄'],
      ['Tanglish', 'Juice ku romba thanks da! 🧃 Semma refreshing!'],
      ['தமிழ்', 'ஜூஸுக்கு மிக்க நன்றி! 🧃'],
    ] },
    { key: 'icecream', chip: '🍦 Ice cream', label: 'the ice cream', emoji: '🍦', msgs: [
      ['English', 'Thank you for the ice cream! 🍦 Sweetest treat ever!'],
      ['Tanglish', 'Ice cream ku thanks da! 🍦 Next time en treat!'],
      ['தமிழ்', 'ஐஸ்கிரீமுக்கு மிக்க நன்றி! 🍦'],
    ] },
    { key: 'coffee', chip: '☕ Coffee / Tea', label: 'the coffee', emoji: '☕', msgs: [
      ['English', 'Thanks for the coffee and the chat! ☕ Made my day.'],
      ['Tanglish', 'Coffee ku thanks da! ☕ Next round en treat!'],
      ['தமிழ்', 'காபிக்கு மிக்க நன்றி! ☕'],
    ] },
    { key: 'pizza', chip: '🍕 Pizza', label: 'the pizza', emoji: '🍕', msgs: [
      ['English', 'Thank you for the pizza! 🍕 You are a slice of awesome!'],
      ['Tanglish', 'Pizza treat ku thanks da! 🍕'],
      ['தமிழ்', 'பீட்சாவுக்கு மிக்க நன்றி! 🍕'],
    ] },
    { key: 'chocolate', chip: '🍫 Chocolate', label: 'the chocolate', emoji: '🍫', msgs: [
      ['English', 'Thank you for the chocolate! 🍫 Sweet like you!'],
      ['Tanglish', 'Chocolate ku thanks da! 🍫'],
      ['தமிழ்', 'சாக்லேட்டுக்கு மிக்க நன்றி! 🍫'],
    ] },
  ];
  var RELS = [
    ['friend', 'Friend'], ['bestie', 'Bestie'], ['love', 'Love ❤️'], ['husband', 'Husband'], ['wife', 'Wife'],
    ['brother', 'Brother'], ['sister', 'Sister'], ['amma', 'Amma'], ['appa', 'Appa'], ['teacher', 'Teacher'],
    ['colleague', 'Colleague'], ['kind', 'Someone kind ✨'],
  ];
  var item = ITEMS[0], rel = '', autoMsg = '';

  var hash = new URLSearchParams(location.hash.slice(1));
  var ref = /^[a-z0-9]{1,12}$/.test(hash.get('r') || '') ? hash.get('r') : '';
  var kind = hash.get('k') === 'ty' ? 'ty' : 'bday';
  if (hash.get('f')) $('from').value = hash.get('f').slice(0, 24);
  if (hash.get('t')) $('to').value = hash.get('t').slice(0, 24);
  history.replaceState(null, '', location.pathname);

  function track(e, wid) {
    if (!EVT_URL) return;
    var body = JSON.stringify({ e: e, k: kind, i: wid || '', r: ref });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(EVT_URL, new Blob([body], { type: 'text/plain' }));
      else fetch(EVT_URL, { method: 'POST', body: body, keepalive: true });
    } catch (err) { /* ignore */ }
  }

  function updateCount() { $('count').textContent = $('msg').value.length; }
  $('msg').addEventListener('input', updateCount);

  function setKind(k) {
    kind = k;
    var K = KINDS[k];
    $('heroEmoji').textContent = K.emoji;
    $('heroTitle').textContent = K.title;
    $('heroSub').textContent = K.sub;
    $('toLabel').textContent = K.toLabel;
    $('msgLabel').textContent = K.msgLabel;
    document.title = K.title + ' ' + K.emoji;
    document.querySelectorAll('.kind').forEach(function (b) { b.classList.toggle('active', b.dataset.kind === k); });
    $('tyExtras').hidden = k !== 'ty';
    renderMsgChips();
    // Replying with a thank-you: start from a ready message so it takes one tap.
    if (k === 'ty' && ref && !$('msg').value) setAutoMsg(K.chips[0][1]);
  }

  function msgChips() {
    return kind === 'ty' && item.msgs ? item.msgs : KINDS[kind].chips;
  }
  function setAutoMsg(text) {
    $('msg').value = text;
    autoMsg = text;
    updateCount();
  }
  function renderMsgChips() {
    var chips = $('chips');
    chips.innerHTML = '';
    msgChips().forEach(function (w) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = w[0];
      b.addEventListener('click', function () { setAutoMsg(w[1]); });
      chips.appendChild(b);
    });
  }

  function pickChips(box, list, isOn, onPick) {
    box.innerHTML = '';
    list.forEach(function (entry) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (isOn(entry) ? ' on' : '');
      b.textContent = entry.chip || entry[1];
      b.addEventListener('click', function () { onPick(entry); });
      box.appendChild(b);
    });
  }
  function renderPickers() {
    pickChips($('itemChips'), ITEMS, function (it) { return it === item; }, function (it) {
      item = it;
      // Swap in this treat's message unless the sender typed their own.
      var msg = $('msg').value.trim();
      if (!msg || msg === autoMsg) setAutoMsg(msgChips()[0][1]);
      renderMsgChips();
      renderPickers();
    });
    pickChips($('relChips'), RELS, function (r) { return r[0] === rel; }, function (r) {
      rel = rel === r[0] ? '' : r[0];
      renderPickers();
    });
  }
  renderPickers();
  document.querySelectorAll('.kind').forEach(function (b) {
    b.addEventListener('click', function () { setKind(b.dataset.kind); });
  });
  setKind(kind);
  track('create_open');

  // One wish id per recipient+message, so preview + send count as a single wish.
  var current = { key: '', id: '', tracked: false };
  function newId() {
    var a = new Uint8Array(8);
    crypto.getRandomValues(a);
    return Array.from(a, function (x) { return (x % 36).toString(36); }).join('');
  }

  function b64url(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function buildLink() {
    var to = $('to').value.trim();
    var from = $('from').value.trim();
    var msg = $('msg').value.trim();
    $('err').textContent = '';
    if (!to) {
      $('err').textContent = kind === 'ty' ? 'Please enter who you want to thank 🙂' : 'Please enter the birthday person’s name 🙂';
      $('to').focus();
      return null;
    }
    var key = kind + '|' + to + '|' + from + '|' + msg + '|' + item.key + '|' + rel;
    if (key !== current.key) current = { key: key, id: newId(), tracked: false };
    if (!current.tracked) { track('link_created', current.id); current.tracked = true; }
    var data = { k: kind, t: to, f: from, m: msg, i: current.id };
    if (kind === 'ty') {
      if (item.key !== 'heart') data.o = item.key;
      if (rel) data.l = rel;
    }
    return { to: to, url: VIEW_URL[kind] + '#d=' + b64url(JSON.stringify(data)) };
  }

  $('waBtn').addEventListener('click', function () {
    var l = buildLink();
    if (!l) return;
    track('wa_share', current.id);
    var wa = 'https://wa.me/?text=' + encodeURIComponent(KINDS[kind].waText(l.to, l.url));
    if (!window.open(wa, '_blank')) location.href = wa;
  });

  $('previewBtn').addEventListener('click', function () {
    var l = buildLink();
    if (l) window.open(l.url + '&p=1', '_blank');  // p=1: sender preview, not counted
  });

  $('copyBtn').addEventListener('click', function () {
    var l = buildLink();
    if (!l) return;
    track('copy', current.id);
    var done = function () {
      $('toast').classList.add('show');
      setTimeout(function () { $('toast').classList.remove('show'); }, 1600);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(l.url).then(done, function () { prompt('Copy this link:', l.url); });
    else prompt('Copy this link:', l.url);
  });
})();
