const pyodide = await loadPyodide();
await pyodide.loadPackage("micropip");

await pyodide.runPythonAsync(`
import micropip
await micropip.install(["segno", "qrcode-artistic", "Pillow"])
`);

await pyodide.runPythonAsync(`
import segno, io, base64
from datetime import datetime

def generate_qr_base64(url, fg, bg, image_bytes):
    qr = segno.make(url)
    buffer = io.BytesIO()

    if image_bytes:
        bg_file = io.BytesIO(image_bytes)
        qr.to_artistic(background=bg_file, target=buffer, scale=5, kind="png")
    else:
        qr.save(buffer, kind='png', scale=5, dark=fg, light=bg)

    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode('utf-8')
    return b64
`);

const generateQR = pyodide.globals.get("generate_qr_base64");

let imageBytes = null;

document.getElementById("bg-img").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) {
    imageBytes = null;
    return;
  }
  const arrayBuffer = await file.arrayBuffer();
  imageBytes = new Uint8Array(arrayBuffer);
  const fileNameSpan = document.getElementById("file-name");
  fileNameSpan.textContent = file.name;
});

document.getElementById("qr-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const url = document.getElementById("url").value.trim();
  const fg = document.getElementById("fg").value;
  const bg = document.getElementById("bg").value;

  if (!url) return;

  let b64;
  if (imageBytes) {
    const pyBytes = pyodide.toPy(imageBytes);
    b64 = generateQR(url, fg, bg, pyBytes);
  } else {
    b64 = generateQR(url, fg, bg, null);
  }
  const timestamp = new Date().toLocaleString();

  const card = document.createElement("div");
  card.className = "card cell";
  card.innerHTML = `
  <div class="card-image">
    <figure class="image is-4by3">
      <img src="data:image/png;base64,${b64}" alt="QR Code" style="width: 100%; height: auto;"/>
    </figure>
  </div>
  <div class="card-content">
    <div class="content">
      <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
      <p><strong>Generated:</strong> ${timestamp}</p>
    </div>
  </div>
  <footer class="card-footer">
    <a href="data:image/png;base64,${b64}" download="qr-code.png" class="card-footer-item">Download PNG</a>
  </footer>
`;

  document.getElementById("cards-container").appendChild(card);
});
