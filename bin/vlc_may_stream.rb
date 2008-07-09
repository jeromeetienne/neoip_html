#!/usr/bin/ruby
#
#

require "pp"
require "vlc_restreamer_t"

vlc_uri_src	= ARGV[0]
may_restream	= Neoip::Videolan_t.may_restream?(vlc_uri_src)
puts "#{vlc_uri_src} may_restream=#{may_restream}"