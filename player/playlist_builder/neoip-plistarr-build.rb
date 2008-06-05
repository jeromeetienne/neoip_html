#!/usr/bin/env ruby
#
# \par Brief Description
# this script generates the playlist_arr (aka the list of playlist_jspf) 
#

require 'neoip_plistarr_builder_t'
require 'rubygems'
require 'json'

playlist_jspf_dirname	= "../cache/playlist.jspf"

# get the list of playlist_jspf filename
fname_arr	= Dir.glob("#{playlist_jspf_dirname}/*.playlist.jspf").sort
# convert it to the proper url
uri_arr		= fname_arr.collect{ |fname|
				playlist_id	= fname.match(/[0-9]{3}\.([^.]*)/)[1]
				"../../cgi-bin/get_playlist.fcgi?playlist_id=#{playlist_id}"
			}

# build the Neoip::Plistarr_builder_t
plistarr_builder	= Neoip::Plistarr_builder_t.new
# populate plistarr_builder.list_arr with fname_arr/uri_arr
for i in (0..uri_arr.length-1)
	plistarr_builder.list_arr << { 	"filename"	=> fname_arr[i],
					"uri"		=> uri_arr[i]	}
end
# save the plistarr file
plistarr_builder.to_file("../cache/ezplayer_playlist_arr.json");

