#!/usr/bin/env ruby
#
# \par Brief Description
# this cgi script provides the playlist jspf for a given neoip-cast 
# - this is a cgi and not a static file, thus if the file doesnt exist. one
#   return a special playlist for not_found

require 'fcgi'

################################################################################
################################################################################
#			Programm itself
################################################################################
################################################################################

def process_cgi(cgi)
	# get the variable of the uri
	uri_var		= cgi.params
	basename	= uri_var['basename']
	
	begin
		dirpath		= "/tmp/.neoip_cast_mdata_server_data/playlist_jspf"
		fullpath	= "#{dirpath}/#{basename}"
	
		# if this playlist doesnt exist, switch 
		if not File.exist?(fullpath)
			basename	= "none_not_found_cast_privhash.playlist_jspf"
			fullpath	= "#{dirpath}/#{basename}"
		end
		
		# try to read the data
		playlist_str	= File.read(fullpath)
	
		# return the playlist_str with a "application/json" content-type
		cgi.out( "type"		=> "application/json" )	{ playlist_str	}
	rescue => e
		cgi.out( "status"	=> "NOT_FOUND")		{ "due to #{e}"	}
	end
end

################################################################################
################################################################################
#			Programm itself
################################################################################
################################################################################


# for play-cgi processing
#cgi	= CGI.new
#process_cgi(cgi);
#exit

FCGI.each_cgi{ |cgi| process_cgi(cgi)	}
