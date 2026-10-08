import { payloads, contrast, svg } from './qr.js';

qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

const $ = id => document.getElementById(id);
const form = $('recipe'), plate = $('plate'), note = $('note'), book = $('book');
const KEY = 'kuhar.recipes';

let image = null;
let current = null;
let recipes = [];
try { recipes = JSON.parse(localStorage.getItem(KEY)) || []; } catch { /* storage blocked: start empty */ }

function cook(text, o) {
  const qr = qrcode(0, o.ecc);
  qr.addData(text, 'Byte');
  qr.make();
  return svg(qr, o);
}

function render() {
  const f = Object.fromEntries(new FormData(form));
  for (const set of form.querySelectorAll('[data-kind]')) set.hidden = set.dataset.kind !== f.kind;
  $('noimage').hidden = !image;

  const text = payloads[f.kind](f);
  let warning = '';
  current = null;
  if (text) {
    try {
      current = { text, f, svg: cook(text, { ...f, image }) };
      const ratio = contrast(f.dark, f.light);
      if (!f.clear && ratio < 1) warning = 'Upside-down dish: light-on-dark codes fail on many scanners. Swap the colours.';
      else if (!f.clear && ratio < 3) warning = 'Colours too close. Scanners may not read this.';
      else if (f.margin < 2) warning = 'Thin rim: keep at least 2 modules of margin for reliable scans.';
    } catch {
      warning = 'Pot overflows: too much content for one QR code. Shorten it or lower the doneness.';
    }
  }
  plate.innerHTML = current ? current.svg : '<p>Add ingredients to start cooking.</p>';
  plate.classList.toggle('empty', !current);
  note.textContent = warning;
  for (const button of document.querySelectorAll('.actions button')) button.disabled = !current;
}

async function shrink(file) {
  const bitmap = await createImageBitmap(file);
  const k = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const canvas = Object.assign(document.createElement('canvas'), { width: bitmap.width * k, height: bitmap.height * k });
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', .85);
}

const png = () => new Promise((resolve, reject) => {
  const size = +current.f.size, picture = new Image();
  picture.onload = () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size });
    canvas.getContext('2d').drawImage(picture, 0, 0, size, size);
    canvas.toBlob(resolve, 'image/png');
  };
  picture.onerror = reject;
  picture.src = 'data:image/svg+xml,' + encodeURIComponent(current.svg);
});

function save(blob, extension) {
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `kuhar-qr.${extension}` });
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function store() {
  try { localStorage.setItem(KEY, JSON.stringify(recipes)); } catch { /* storage blocked: keep in memory */ }
  shelf();
}

function restore(f) {
  form.reset();
  for (const [name, value] of Object.entries(f)) {
    const field = form.elements[name];
    if (!field) continue;
    if (field.type === 'checkbox') field.checked = true;
    else field.value = value;
  }
  $('image').value = '';
  image = null;
  render();
  form.scrollIntoView({ behavior: 'smooth' });
}

function shelf() {
  $('shelf').hidden = !recipes.length;
  book.replaceChildren(...recipes.map((recipe, i) => {
    const item = document.createElement('li');
    const reheat = Object.assign(document.createElement('button'), { type: 'button', className: 'thumb', title: 'Reheat this recipe' });
    reheat.innerHTML = cook(recipe.text, { ...recipe.f, size: 96 });
    reheat.onclick = () => restore(recipe.f);
    const label = Object.assign(document.createElement('p'), { textContent: recipe.text });
    const time = Object.assign(document.createElement('time'), { textContent: new Date(recipe.at).toLocaleString() });
    const remove = Object.assign(document.createElement('button'), { type: 'button', className: 'remove', textContent: '×' });
    remove.setAttribute('aria-label', 'Delete recipe');
    remove.onclick = () => { recipes.splice(i, 1); store(); };
    item.append(reheat, label, time, remove);
    return item;
  }));
}

form.addEventListener('input', render);
form.addEventListener('submit', e => e.preventDefault());

$('image').addEventListener('change', async e => {
  const file = e.target.files[0];
  try {
    image = file ? await shrink(file) : null;
    if (image) form.elements.ecc.value = 'H'; // centre dots need the strongest error correction
    render();
  } catch {
    image = null;
    render();
    note.textContent = 'Could not read that image.';
  }
});
$('noimage').onclick = () => { $('image').value = ''; image = null; render(); };

$('png').onclick = async () => save(await png(), 'png');
$('svg').onclick = () => save(new Blob([current.svg], { type: 'image/svg+xml' }), 'svg');
if (!window.ClipboardItem) $('copy').remove();
else $('copy').onclick = async () => {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png() })]);
    note.textContent = 'Copied. Paste it anywhere.';
  } catch {
    note.textContent = 'Copy blocked by the browser. Use a download instead.';
  }
};
$('keep').onclick = () => {
  recipes = [{ text: current.text, f: current.f, at: Date.now() }, ...recipes].slice(0, 24);
  store();
};
$('clear').onclick = () => { recipes = []; store(); };

const preset = new URLSearchParams(location.search).get('text');
if (preset) form.elements.text.value = preset;

render();
shelf();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
