#!/usr/bin/env ruby

# HTTP response headers, including double newline
#print "Content-type: text/plain\n\n"

# Contents
#print "Hello, world\n"

require "xmlrpc/server"

cgi_server = XMLRPC::CGIServer.new
cgi_server.add_handler("sum") { |a,b| a + b }
cgi_server.serve