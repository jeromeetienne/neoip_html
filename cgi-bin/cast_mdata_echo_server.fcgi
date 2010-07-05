#!/usr/bin/env ruby
#
# This small php script is a trick to 'echo' the bt_cast_mdata_t on a server
# - this allow to get a simple server running on a inetreach server
#   - neoip-casti may not be inet reach
# - thus neoip-casti can send their bt_cast_mdata_t here and the 
#   neoip-casto can retrieve them here too.
# - WARNING: absolutly no check or security is done
#   - this is prototype only
# - TEST in ruby
#   - require 'xmlrpc/client'
#   - server = XMLRPC::Client.new2("http://jmehost1/~jerome/neoip_html/cgi-bin/cast_mdata_echo_server.rb")
#   - server.call("set_cast_mdata_push", "superstream.flv", "bonjour", { :slota => 'bip', :goup => 'slsdfadfsl' })
#   - server.call("get_cast_mdata", "superstream.flv", "1f71e0f4")
#   - begin; server.call("get_cast_mdata", "superstream.flv", "1f71e0f4"); rescue => e; puts "Received fault code #{e.faultCode} String #{e.faultString}"; end
# - all the data are stored in "/tmp/.neoip_cast_mdata_echo_php." 
#   - this is due to some file permissions stuff
#   - ugly but easy
# -----------------------------
# - how to measure latency
#   - Time.now - Time.at(server.call("get_cast_mdata", "superstream", "1f71e0f4")['casti_date'])
#   - works if done with echo_server and casti clock are insync. like on the same box
#   - usefull to test the casti_date compensation
# -----------------------------
# - ubuntu package libapache2-mod-fcgid is needed in appache
# - ubuntu package libfcgi-ruby1.8 is needed for ruby
########################################
require "xmlrpc/server"

# NOTE: force the usage of the pure-ruby version of fcgi. 
# - this is required by the workaround to get fcgi+xmlrpc working together
FCGI_PURE_RUBY=true
require 'fcgi'

require File.join(File.dirname(__FILE__), '../bt_cast/mdata_echo_server/bt_cast_mdata_server_t.rb')

################################################################################
################################################################################
#			CGI handling for xmlrpc
################################################################################
################################################################################
# - for basic xmlrpc via CGI example
#   - see http://www.ntecs.de/projects/xmlrpc4r/server.html#label-19

# create the directory needed for Neoip::Cast_mdata_server_t
Neoip::Cast_mdata_server_t.create_dir_ifneeded();

# init the cgi_server
cgi_server	= XMLRPC::CGIServer.new     
# register all the xmlrpc function
cgi_server.add_handler("set_cast_mdata_pull") do |web2srv_str, cast_name, cast_privtext, cast_id, 
						port_lview, port_pview, uri_pathquery|
	Neoip::Cast_mdata_server_t.set_cast_mdata_pull(web2srv_str, cast_name, cast_privtext, cast_id,
						port_lview, port_pview, uri_pathquery, ENV['REMOTE_ADDR']);
end 
cgi_server.add_handler("set_cast_mdata_push") do |web2srv_str, cast_name, cast_privtext, cast_mdata|
	Neoip::Cast_mdata_server_t.set_cast_mdata_push(web2srv_str, cast_name, cast_privtext, cast_mdata);
end 
cgi_server.add_handler("get_cast_mdata") do |cast_name, cast_privhash|
	Neoip::Cast_mdata_server_t.get_cast_mdata(cast_name, cast_privhash);
end 
cgi_server.add_handler("del_cast_mdata") do |cast_name, cast_privtext|
	Neoip::Cast_mdata_server_t.del_cast_mdata(cast_name, cast_privtext);
end

# handle the unknown/bad formered calls
cgi_server.set_default_handler do |name, *args|
	raise XMLRPC::FaultException.new(-99, "Method #{name} missing" +
                                   " or wrong number of parameters!")
end

# server the cgi_server
#cgi_server.serve
#exit
  
# experiment at using fast-cgi
FCGI.each_request do |request|
	# XMLRPC::CGIServer expect some value in ENV[] but FCGI doesnt provides them
	# - so working around by copying them by hand... dirty 
	ENV['REMOTE_ADDR']	= request.env['REMOTE_ADDR'];
	ENV['REQUEST_METHOD']	= request.env['REQUEST_METHOD'];
	ENV['CONTENT_TYPE']	= "text/xml";
	ENV['CONTENT_LENGTH']	= "#{request.in.length}";

	# copy the request in/out into the stdin/stdout to act as a CGI
	$stdin	= request.in
	$stdout	= request.out

	# process the cgi itself
	cgi_server.serve

	# mark the request as finished
	request.finish
end