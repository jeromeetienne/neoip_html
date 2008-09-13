#!/usr/bin/env ruby
#
# \par Brief Description
# ultra basic test bed for cast_mdata_echo_server.rb
#


require 'xmlrpc/client'

# init the xmlrpc client
server = XMLRPC::Client.new2("http://jmehost2/~jerome/neoip_html/cgi-bin/cast_mdata_echo_server.rb")


# set some variables
cast_name	= "superstream.flv"
cast_privtext	= "bonjour"
cast_privhash	= nil;
cast_mdata	= { :slota => 'bip', :casti_date => 4242 }

################################################################################
# do a publish
begin
	cast_privhash	= server.call("set_cast_mdata_push", cast_name, cast_privtext, cast_mdata)
	puts "set_cast_mdata_push return #{cast_privhash}"
rescue => e
	puts "set_cast_mdata_push failed with #{e.faultCode} String #{e.faultString}" 
end

################################################################################
# do a query
begin
	ret	= server.call("get_cast_mdata", cast_name, cast_privhash)
	puts "get_cast_mdata return #{ret}"
rescue => e
	puts "get_cast_mdata failed with #{e.faultCode} String #{e.faultString}" 
end

################################################################################
# do a delete
begin
	ret	= server.call("del_cast_mdata", cast_name, cast_privtext)
	puts "del_cast_mdata return #{ret}"
rescue => e
	puts "del_cast_mdata failed with #{e.faultCode} String #{e.faultString}" 
end