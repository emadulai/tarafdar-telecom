"""Serve the shop on this computer, using the same origin on every start."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from webbrowser import open_new_tab


def main():
    folder = Path(__file__).resolve().parent / "public"
    url = "http://127.0.0.1:8765/"
    handler = partial(SimpleHTTPRequestHandler, directory=str(folder))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", 8765), handler)
    except OSError as error:
        raise SystemExit(f"Could not start {url} ({error})")
    with server:
        print(f"Shop: {url}  |  Keep this window open. Press Ctrl+C to stop.", flush=True)
        open_new_tab(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
