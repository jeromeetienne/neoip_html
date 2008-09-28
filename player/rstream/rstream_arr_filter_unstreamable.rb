#!/usr/bin/ruby
#
# \par Brief Description


require 'tvrover_t'
require "vlc_restreamer_t"
require 'rubygems'
require 'json'
require 'pp'

# get rstream_arr from stdin
data_str	= $stdin.read
data_json	= JSON.parse(data_str)

rstream_arr	= data_json

#pp rstream_arr
puts "contains #{rstream_arr.length} rstreams restreamable or not"

# remove all rstream which are not restreamable
rstream_arr.delete_if { |item|
	puts "testing #{item['cast_name']} at #{item['stream_uri']}"

	vlc_uri_src	= item['stream_uri']
	may_restream	= Neoip::Videolan_t.may_restream?(vlc_uri_src)
	puts "#{vlc_uri_src} may_restream=#{may_restream}"
	not may_restream
}


pp rstream_arr
puts "contains #{rstream_arr.length} rstreams restreamable"

# output the rstream_arr
$stderr.puts JSON.pretty_generate(rstream_arr)


