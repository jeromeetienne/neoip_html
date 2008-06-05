#!/usr/bin/env ruby
#

# NOTE: force the usage of the pure-ruby version of fcgi. 
# - this is required by the workaround to get fcgi+xmlrpc working together
FCGI_PURE_RUBY=true
require 'rubygems' rescue nil
require "xmlrpc/server"
require 'fcgi'
require 'yaml'
require 'pp'


# NOTE: this one works with .each_cgi
# - but im unable to make .each_request works

if true
	cgi_server = XMLRPC::CGIServer.new
	cgi_server.add_handler("sum") { |a,b| a + b }
	FCGI.each_request { |request|
		$stdin	= request.in
		$stdout	= request.out
		$stderr	= request.err

		ENV['REMOTE_ADDR']	= request.env['REMOTE_ADDR'];
		ENV['REQUEST_METHOD']	= request.env['REQUEST_METHOD'];
		ENV['CONTENT_TYPE']	= "text/xml";
		ENV['CONTENT_LENGTH']	= "#{request.in.length}";

		cgi_server.serve
		request.finish
	}
	exit
end

if false
	FCGI.each { |request|
		out		= request.out
		out.print	"Content-Type: text/html"
		out.print	"\r\n"
		out.print	"\r\n"
#		out.print	"remote_addr=#{request.env['REMOTE_ADDR']}"
#		out.print	"request_method=#{request.env['REQUEST_METHOD']}"
#		out.print	request.env['REMOTE_ADDR']
		out.print	request.env.inspect
		out.print	"input=#{request.in.length}"
		out.print	"Hppello, World!\n"
		request.finish
	}
end

if false
	FCGI.each_cgi{|cgi| cgi.out{ "<pre>#{ cgi.env_table.to_hash.to_yaml }</pre>" }}
end
