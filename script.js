const pyodide = await loadPyodide();
await pyodide.loadPackage("micropip");

await pyodide.runPythonAsync(`
import micropip
await micropip.install("segno")
`);

await pyodide.runPythonAsync(`
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
    qr.save(
        buffer, 
        kind='png', 
        scale=5, 
        dark=fg,
        light=bg
    )
    buffer.seek(0)
    b64 = base64.b64encode(buffer.read()).decode("ascii")
    data_uri = "data:image/png;base64," + b64

    document.getElementById("qr-img").src = data_uri

document.getElementById("qr-form").addEventListener(
    "submit", create_proxy(generate_qr)
)
`);
