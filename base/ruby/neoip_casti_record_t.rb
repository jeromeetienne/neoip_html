#!/usr/bin/ruby
#
# \par Brief Description
# Class to record with neoip-casti

# the 'require' for the library i use
require 'xmlrpc/client'

module	Neoip
class	Casti_record_t

attr_reader	:cast_privhash	# the cast_privhash returned by neoip-casti
attr_reader	:cast_name

################################################################################
################################################################################
#			Constructor
################################################################################
################################################################################

def initialize(apps_detect_uri, cast_name, cast_privtext, mdata_srv_uri = nil,
				httpi_uri = nil, httpi_mod = nil,http_peersrc_uri = nil,
				web2srv_str = nil)
	# copy the parameter
	@apps_detect_uri	= apps_detect_uri;
	@cast_name		= cast_name;
	@cast_privtext		= cast_privtext;
	@mdata_srv_uri		= mdata_srv_uri		|| "";
	@httpi_uri		= httpi_uri		|| "";
	@httpi_mod		= httpi_mod		|| "";
	@http_peersrc_uri	= http_peersrc_uri	|| "";
	@web2srv_str		= web2srv_str		|| "{source: \"internal ruby\"}";
end


################################################################################
################################################################################
#
################################################################################
################################################################################

# Send a request stream
def request_stream()
	# build the uri of the xmlrpc server to probe
	uri	= "#{@apps_detect_uri}/neoip_casti_ctrl_wpage_xmlrpc.cgi"
	# define the xmlrpc server object
	server	= XMLRPC::Client.new2(uri)
	# call the xmlrpc server with "request_stream" 
	begin
		@cast_privhash	= server.call("request_stream", @mdata_srv_uri, @cast_name,
						@cast_privtext, @httpi_uri,
						@httpi_mod, @http_peersrc_uri,
						@web2srv_str);
		# determine the cur_state depending on the returned @cast_privhash
		cur_state	= @cast_privhash == "" ? "starting" : "started"
	rescue => e
		@cast_privhash	= "";
		cur_state	= "error due to " + e
		# log to debug
		#puts "fault #{e.faultCode}: #{e.faultString}"
	end
	# return the result
	return cur_state
end


# Send a release stream
def release_stream()
	# build the uri of the xmlrpc server to probe
	uri	= "#{@apps_detect_uri}/neoip_casti_ctrl_wpage_xmlrpc.cgi"
	# define the xmlrpc server object
	server	= XMLRPC::Client.new2(uri)
	# call the xmlrpc server with "release_stream" 
	server.call("release_stream", @mdata_srv_uri, @cast_name, @cast_privtext)
end

end	# end of class Casti_record_t
end	# end of module Neoip