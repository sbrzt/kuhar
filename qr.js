const wifiEsc = s => s.replace(/([\\;,:"])/g, '\\$1');
const vcardEsc = s => s.replace(/([\\;,])/g, '\\$1');

export const payloads = {
  text: f => f.text.trim(),
  wifi: f => f.ssid &&
    `WIFI:T:${f.enc};S:${wifiEsc(f.ssid)};${f.enc === 'nopass' ? '' : `P:${wifiEsc(f.pass)};`}${f.hidden ? 'H:true;' : ''};`,
  contact: f => f.name && [
    'BEGIN:VCARD', 'VERSION:3.0', `N:${vcardEsc(f.name)}`, `FN:${vcardEsc(f.name)}`,
    f.org && `ORG:${vcardEsc(f.org)}`, f.tel && `TEL:${vcardEsc(f.tel)}`,
    f.mail && `EMAIL:${vcardEsc(f.mail)}`, f.url && `URL:${vcardEsc(f.url)}`, 'END:VCARD',
  ].filter(Boolean).join('\n'),
  email: f => {
    const query = ['subject', 'body'].filter(k => f[k]).map(k => `${k}=${encodeURIComponent(f[k])}`).join('&');
    return f.to && `mailto:${f.to}${query && '?' + query}`;
  },
};

const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return .2126 * r + .7152 * g + .0722 * b;
};

export const contrast = (dark, light) => (luminance(light) + .05) / (luminance(dark) + .05);

const box = (x, y, s, r) => r
  ? `M${x + r} ${y}h${s - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${s - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}` +
    `h${2 * r - s}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - s}a${r} ${r} 0 0 1 ${r} ${-r}z`
  : `M${x} ${y}h${s}v${s}h${-s}z`;

const RADIUS = { square: 0, rounded: .3, dots: .5 };

export function svg(qr, o) {
  const n = qr.getModuleCount(), m = +o.margin, w = n + 2 * m, k = RADIUS[o.shape] ?? 0;
  const finder = (r, c) => (r < 7 && (c < 7 || c >= n - 7)) || (r >= n - 7 && c < 7);
  const s = o.image ? (o.shape === 'dots' ? .6 : .5) : 1;
  const v = (n - 17) / 4, count = v < 2 ? 0 : Math.floor(v / 7) + 2;
  const step = v === 32 ? 26 : Math.ceil((n - 13) / (count * 2 - 2)) * 2;
  const centres = Array.from({ length: count }, (_, i) => i ? n - 7 - (count - 1 - i) * step : 6);
  const near = x => centres.some(p => Math.abs(x - p) < 3);
  const full = (r, c) => o.image && (r === 6 || c === 6 || (near(r) && near(c)));
  let dark = '', light = '';

  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (finder(r, c)) continue;
    const t = full(r, c) ? 1 : s;
    const d = box(m + c + (1 - t) / 2, m + r + (1 - t) / 2, t, t * k);
    if (qr.isDark(r, c)) dark += d;
    else if (o.image) light += d;
  }
  for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    const x = m + c, y = m + r;
    dark += box(x, y, 7, 7 * k) + box(x + 1, y + 1, 5, 5 * k) + box(x + 2, y + 2, 3, 3 * k);
    if (o.image) light += box(x - 1, y - 1, 9, 0); // eye plus separator
  }
  const trim = d => d.replace(/\d+\.\d{4,}/g, v => +(+v).toFixed(3));
  const crisp = !o.image && !k ? ' shape-rendering="crispEdges"' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" width="${o.size}" height="${o.size}" role="img" aria-label="QR code"${crisp}>` +
    (o.image ? `<image href="${o.image}" width="${w}" height="${w}" preserveAspectRatio="xMidYMid slice"/>`
      : o.clear ? '' : `<rect width="${w}" height="${w}" fill="${o.light}"/>`) +
    (light && `<path fill="${o.light}" d="${trim(light)}"/>`) +
    `<path fill="${o.dark}" fill-rule="evenodd" d="${trim(dark)}"/></svg>`;
}
