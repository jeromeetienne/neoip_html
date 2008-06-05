#!/usr/bin/env ruby
#
# \par Brief Description
# this cgi script provides the playlist jspf 
# - this is a cgi in order to monitor when a given playlist is read or not
#   - e.g. this allow not to generate playlist which arent read by anybody

require 'fcgi'

################################################################################
################################################################################
#			Programm itself
################################################################################
################################################################################

def process_cgi(cgi)
	# get the variable of the uri
	uri_var		= cgi.params
	playlist_id	= uri_var['playlist_id']
	
	begin
		dirpath		= "../player/cache/playlist.jspf"
		fullpath	= Dir.glob("#{dirpath}/???.#{playlist_id}.playlist.jspf")[0]
	
		# write nothing into a file - just to keep the date of the lastread
		readctx_fname	= "/tmp/.neoip_jsplayer_playlist.#{playlist_id}.lastread"
		File.open(readctx_fname, 'w+'){ |f| f.write('')	}
		
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

# for fcgi processing
FCGI.each_cgi{ |cgi| process_cgi(cgi)	}
