#! /usr/bin/env python
# This script is the client part of the lantency bench
# - see latencybench-server.py for details on this test

import asyncore, socket, urlparse, optparse
import string
import time
from pprint import pprint

class http_client(asyncore.dispatcher):
    def __init__(self, url_str):
        asyncore.dispatcher.__init__(self)
        url = urlparse.urlparse(url_str);
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.connect( (url.hostname, url.port) )
        self.buffer = 'GET %s HTTP/1.0\r\n\r\n' % (url.path + '?' + url.query)
        self.recv_buf       = '';
        self.header_read   = False

    def handle_read(self):
        self.recv_buf   +=  self.recv(8192)
        lines           = self.recv_buf.split('\r\n')
        self.recv_buf   = lines.pop()
        for line in lines:
            #print 'line len=%d' % len(line)
            #print 'line=%s' % line
            # if the header is not yet read, mark it as read now
            if line == '' and self.header_read == False:
                self.header_read    = True
                continue;
            # if http header is not read, goto next line
            if self.header_read == False:
                continue;
            # if this line is not a timestamp, remove it
            if line.startswith('TIMESTAMP ') == False :
                continue;
            # remove the endline character from the string
            line = line.split(' ')[1].replace("\r\n", "").strip()
            
            # this string is
            #print line
            lantency_sec    = time.time() - float(line)
            print "latency is %f" % (lantency_sec)

    def handle_connect(self):
        pass

    def handle_close(self):
        self.close()

    def writable(self):
        return (len(self.buffer) > 0)

    def handle_write(self):
        sent = self.send(self.buffer)
        self.buffer = self.buffer[sent:]

# parse the cmdline option
optparser    = optparse.OptionParser()
(options, args) = optparser.parse_args()

# set default values
url_str = "http://127.0.0.1:4560/aaf4c61d/latencybench?mdata_srv_uri=http%3A//localhost/%7Ejerome/neoip_html/bt_cast/casto/testrpc.php/castiRecordWebSrv/RPC2"
#url_str = "http://localhost:1234"

# overwrite default args if available
if len(args) > 0:
    url_str = args[0]

# log to debug
print "Start a latency bench toward : %s" % url_str

# launch the http client
myclient    = http_client(url_str)
asyncore.loop()