#! /usr/bin/env python
# This script is the client part of the lantency bench
# - see latencybench-server.py for details on this test
# - TODO issue the whole file is fully in ram
#   - possible solution: have stringio to be rewinded once it is parsed
#   - high cpu but nice memory

import asyncore, socket
import StringIO

class http_client(asyncore.dispatcher):
    def __init__(self):
        asyncore.dispatcher.__init__(self)
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.connect( ('localhost', 1234) )
        self.buffer = 'GET / HTTP/1.0\r\n\r\n'
        self.recv_buf       = StringIO.StringIO();
        self.nread_bytes    = 0
        self.header_read   = False

    def handle_read(self):
        self.recv_buf.seek(0, 2);
        self.recv_buf.write( self.recv(8192) )
        self.recv_buf.seek(self.nread_bytes, 0);
        for line in self.recv_buf.readlines():
            self.nread_bytes    += len(line)
            # if the header is not yet read, mark it as read now
            if line == "\r\n" and self.header_read == False:
                self.header_read    = True
                continue;
            # if http header is not read, goto next line
            if self.header_read == False:
                continue;
            # remove the endline character from the string
            line = line.replace("\r\n", "")
            # this string is 
            print line

    def handle_connect(self):
        pass

    def handle_close(self):
        self.close()

    def writable(self):
        return (len(self.buffer) > 0)

    def handle_write(self):
        sent = self.send(self.buffer)
        self.buffer = self.buffer[sent:]

myclient    = http_client()
asyncore.loop()