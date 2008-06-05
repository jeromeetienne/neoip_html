#!/usr/bin/ruby
#
# \par Brief Description
# Some function to build a plistarr
#
# - TODO make a class neoip_plistarr_t
# - TODO dont rely on the playlist.jspf as it is now
#   - this force to generate the playlist.jspf before generating the plistarr
# - TODO change the precedence stuff
#   - dont rely on the filename. this create 'dirty' filename


require 'rubygems'
require 'json'
require File.join(File.dirname(__FILE__), 'neoip_playlist_t.rb')



module	Neoip
class	Plistarr_builder_t

attr_accessor	:list_arr	# object the list of playlist filename

################################################################################
################################################################################
#			constructor
################################################################################
################################################################################

def initialize()
	@list_arr	= []
end

################################################################################
################################################################################
#			from_file/to_file
################################################################################
################################################################################

# save the current Playlist_t to a filename
def to_file(dest_fname)
	playlist_arr	= []
	
	@list_arr.each { |item|
		playlist	= Neoip::Playlist_t.from_file(item['filename']);
		playlist_title	= playlist.jspf['title'];
		playlist_id	= playlist.jspf['identifier'];
		external_dep	= playlist.jspf['extension']['external_dep'];
	
		# build the item to add
		arr_item	= {};
		arr_item['playlist_title']	= playlist_title;
		arr_item['playlist_uri']	= item['uri'];
		arr_item['external_dep']	= external_dep || {};
	
		# add this item in the playlist_arr
		playlist_arr.push(arr_item);
	}
	
	# write the playlist_arr into a file using JSON format
	json_data	= JSON.pretty_generate(playlist_arr)
	File.open(dest_fname, 'w+'){|f| f.write(json_data) }
end

end	# end of class Plistarr_builder_t
end	# end of module Neoip



