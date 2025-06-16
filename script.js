const pyodide = await loadPyodide();
await pyodide.loadPackage("micropip");

await pyodide.runPythonAsync(`
import micropip
await micropip.install(["segno", "qrcode-artistic", "Pillow"])
`);

const pyCode = `
import segno, io, base64
from js import document
from pyodide.ffi import create_proxy

def generate_qr(event):
    event.preventDefault()
    url = document.getElementById("url").value
    if not url:
        return
    fg = document.getElementById("fg").value
    bg = document.getElementById("bg").value

    qr = segno.make(url)
    buffer = io.BytesIO()

    global_image_bytes = globals().get("image_bytes", None)

    if global_image_bytes:
        bg_file = io.BytesIO(global_image_bytes)
        qr.to_artistic(background=bg_file, target=buffer, scale=5, kind="png")
    else:
        qr.save(buffer, kind='png', scale=5, dark=fg, light=bg)

    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode("ascii")
    data_uri = "data:image/png;base64," + b64
    document.getElementById("qr-img").src = data_uri

document.getElementById("qr-form").addEventListener(
    "submit", create_proxy(generate_qr)
)
`;

await pyodide.runPythonAsync(pyCode);

document.getElementById("bg-img").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) {
      await pyodide.runPythonAsync("image_bytes = None");
      return;
    }
  
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pyBytes = pyodide.toPy(uint8Array);
    await pyodide.globals.set("image_bytes", pyBytes);
});
