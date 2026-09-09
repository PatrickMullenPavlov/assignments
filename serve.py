#!/usr/bin/env python3
"""Static server for the prototype, with caching turned off.

python -m http.server sends Last-Modified and honours If-Modified-Since, so a
browser will happily keep an old styles.css and you end up debugging CSS that
was already correct. Nothing here is big enough to need a cache.
"""

import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):  # one line per request, no noise
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    handler = partial(NoCache, directory=str(__import__("pathlib").Path(__file__).parent))
    print(f"Trig prototype → http://127.0.0.1:{port}")
    HTTPServer(("127.0.0.1", port), handler).serve_forever()
