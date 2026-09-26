// iNiXR AR Birthday Wish — creator page.
// The wish is packed into the link's #fragment, so names/messages never reach our server.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var EVT_URL = document.body.dataset.evt;
  var VIEW_URL = document.body.dataset.view;

  var WISHES = [
    ['English', 'Happy Birthday! 🎂 Wishing you a year full of joy, love and success!'],
    ['Fun', 'Happy Birthday my friend! Stay awesome, stay crazy 😄🎉'],
    ['தமிழ்', 'இனிய பிறந்தநாள் நல்வாழ்த்துக்கள்! 🎂 உங்கள் வாழ்வில் எல்லா மகிழ்ச்சியும் நிறையட்டும்!'],
    ['தமிழ் 2', 'பிறந்தநாள் வாழ்த்துக்கள்! 🎉 நீங்கள் நினைத்தது எல்லாம் நடக்கட்டும்!'],
    ['Tanglish', 'Happy Birthday da! 🎂 Innum neraya vayasu aagattum… treat eppo? 😄'],
  ];

  var hash = new URLSearchParams(location.hash.slice(1));
  var ref = /^[a-z0-9]{1,12}$/.test(hash.get('r') || '') ? hash.get('r') : '';
  if (hash.get('f')) $('from').value = hash.get('f').slice(0, 24);
  if (hash.get('t')) $('to').value = hash.get('t').slice(0, 24);
  history.replaceState(null, '', location.pathname);

  function track(e, wid) {
    if (!EVT_URL) return;
    var body = JSON.stringify({ e: e, i: wid || '', r: ref });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(EVT_URL, new Blob([body], { type: 'text/plain' }));
      else fetch(EVT_URL, { method: 'POST', body: body, keepalive: true });
    } catch (err) { /* ignore */ }
  }
  track('create_open');

  // Message chips
  WISHES.forEach(function (w) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = w[0];
    b.addEventListener('click', function () { $('msg').value = w[1]; updateCount(); });
    $('chips').appendChild(b);
  });
  function updateCount() { $('count').textContent = $('msg').value.length; }
  $('msg').addEventListener('input', updateCount);

  // One wish id per recipient, so preview + send count as a single wish.
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
      $('err').textContent = 'Please enter the birthday person’s name 🙂';
      $('to').focus();
      return null;
    }
    var key = to + '|' + from + '|' + msg;
    if (key !== current.key) current = { key: key, id: newId(), tracked: false };
    if (!current.tracked) { track('link_created', current.id); current.tracked = true; }
    var data = { t: to, f: from, m: msg, i: current.id };
    return { to: to, url: VIEW_URL + '#d=' + b64url(JSON.stringify(data)) };
  }

  $('waBtn').addEventListener('click', function () {
    var l = buildLink();
    if (!l) return;
    track('wa_share', current.id);
    var text = '🎂 ' + l.to + ', I sent you a birthday surprise! Tap to open 👉 ' + l.url;
    var wa = 'https://wa.me/?text=' + encodeURIComponent(text);
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
