#! /usr/bin/env python
# This script is the server part of the latency bench
#
# \par process description
# the lantency bench principle is:
# 1. run a http server which serve infinitly long connections like a stream.
#    - those connections output present timestamp in ascii every second
#    - ./latencybench-server.py
# 2. have casti to read this stream (in type raw)
#    $ cd ~/workspace/yavipin/html/player/rstream
#    $ ./neoip-casti-recording.rb --cast_name "latencybench" --cast_privtext hello --httpi_mod raw --mdata_srv_uri http://rstream.urfastr.net/frontend_dev.php/castiRecordWebSrv/RPC2 --httpi_uri http://localhost:1234
# 3. have casto to read this stream
# 4. have latencybench-client.py to read from casto
#    - this script parse the ascii timestamp from the stream
#    - it substracts the present time and the difference is the
#      lantency induced by webpack
#    - ./latencybench-client.py
#
# \par TODO
# - it seems really short... 0.05 to 0.08sec how come

import SocketServer, optparse
import SimpleHTTPServer
import time

class Proxy(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        # return a 200 http code
        self.send_response(200)
        self.end_headers()
        # infinit loop with a timestamp every second
        while(True):
            # write the timestamp
            str = 'TIMESTAMP %s\r\n' % time.time()
            self.wfile.write(str)
            # write a padding string to ensure a high byterate
            pad_len = rate_kbyte*1024 - len(str) - len('\r\n')
            self.wfile.write('%s\r\n' % (' '*pad_len))
            # sleep for one second
            time.sleep(0.2)


optparser    = optparse.OptionParser()
optparser.add_option('-r', '--rate', dest='send_rate', default=64, type='int',
                    help='set output rate in kbyte', metavar='kbyte')
optparser.add_option('-p', '--port', dest='listen_port', default=1234, type='int',
                    help='set the listening port of http server', metavar='PORT')
(options, args) = optparser.parse_args()

listen_port = options.listen_port
rate_kbyte  = options.send_rate


SocketServer.ForkingTCPServer.allow_reuse_address   = 1;
httpd = SocketServer.ForkingTCPServer(('', listen_port), Proxy)
print "server listenint at port %s at %skbyte" % (listen_port, rate_kbyte)
httpd.serve_forever()
