// Self-check for qr.js. Run: node check.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { payloads, contrast, svg } from './qr.js';

const qrcode = createRequire(import.meta.url)('./vendor/qrcode.js');

assert.equal(payloads.text({ text: '  hi  ' }), 'hi');
assert.equal(payloads.wifi({ ssid: 'My;Net', pass: 'a:b', enc: 'WPA' }), 'WIFI:T:WPA;S:My\\;Net;P:a\\:b;;');
assert.equal(payloads.wifi({ ssid: 'Open', pass: 'ignored', enc: 'nopass', hidden: 'on' }), 'WIFI:T:nopass;S:Open;H:true;;');
assert.equal(payloads.wifi({ ssid: '', pass: 'x', enc: 'WPA' }), '');
assert.equal(payloads.contact({ name: 'Ana, Chef', tel: '+386 1', org: '', mail: '', url: '' }),
  'BEGIN:VCARD\nVERSION:3.0\nN:Ana\\, Chef\nFN:Ana\\, Chef\nTEL:+386 1\nEND:VCARD');
assert.equal(payloads.email({ to: 'a@b.si', subject: 'Hi there', body: '' }), 'mailto:a@b.si?subject=Hi%20there');
assert.equal(payloads.email({ to: 'a@b.si', subject: '', body: '' }), 'mailto:a@b.si');

assert.equal(Math.round(contrast('#000000', '#ffffff')), 21);
assert.ok(contrast('#ffffff', '#000000') < 1);

const qr = qrcode(0, 'M');
qr.addData('https://example.com', 'Byte');
qr.make();
const n = qr.getModuleCount();
const base = { dark: '#000000', light: '#ffffff', margin: '4', size: '512' };

for (const shape of ['square', 'rounded', 'dots']) {
  const out = svg(qr, { ...base, shape });
  assert.ok(out.includes(`viewBox="0 0 ${n + 8} ${n + 8}"`), shape);
  assert.ok(!/NaN|undefined|null/.test(out), shape);
}
// Square render draws one box per dark data module plus 3 boxes per finder eye.
let dark = 0;
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
  const finder = (r < 7 && (c < 7 || c >= n - 7)) || (r >= n - 7 && c < 7);
  if (!finder && qr.isDark(r, c)) dark++;
}
assert.equal(svg(qr, { ...base, shape: 'square' }).match(/M/g).length, dark + 9);
assert.ok(!svg(qr, { ...base, shape: 'square', clear: 'on' }).includes('<rect'));
assert.ok(svg(qr, { ...base, shape: 'square', image: 'data:image/jpeg;base64,AAAA' }).includes('<image'));

console.log('ok');
