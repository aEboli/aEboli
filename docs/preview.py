from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Timer
import webbrowser

root=Path(__file__).resolve().parent
handler=partial(SimpleHTTPRequestHandler,directory=str(root))
with ThreadingHTTPServer(('127.0.0.1',0),handler) as server:
    url=f'http://127.0.0.1:{server.server_address[1]}/'
    print(f'3D preview: {url}\nPress Ctrl+C to stop.')
    Timer(.5,lambda:webbrowser.open_new_tab(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
