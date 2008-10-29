#!/usr/bin/ruby
#
# \par Brief Description

require "vlc_restreamer_t"

stream_uri	= ARGV[0]
puts "Testing stream_uri=#{stream_uri} ..."
restreamable	= Neoip::Videolan_t.may_restream?(stream_uri)
puts "may_stream=#{restreamable}"
exit(restreamable)


