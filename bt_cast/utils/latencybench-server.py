#! /usr/bin/env python
# This script is the server part of the latency bench
# the lantency bench principle is:
# 1. run a http server which serve infinitly long connections like a stream.
#    - those connections output present timestamp in ascii every second
# 2. have casti to read this stream (in type raw)
# 3. have casto to read this stream
# 4. have latencybench-client.py to read from casto
#    - this script parse the ascii timestamp from the stream
#    - it substracts the present time and the difference is the
#      lantency induced by webpack

import SocketServer
import SimpleHTTPServer
import time

PORT = 1234

class Proxy(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        # return a 200 http code
        self.send_response(200)
        self.end_headers()
        # infinit loop with a timestamp every second
        while(True):
            self.wfile.write('%s\r\n' % time.time())
            time.sleep(1)

SocketServer.ForkingTCPServer.allow_reuse_address   = 1;
httpd = SocketServer.ForkingTCPServer(('', PORT), Proxy)
print "serving at port", PORT
httpd.serve_forever()
