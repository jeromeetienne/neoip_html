#!/usr/bin/ruby
#
# \par Brief Description
# This is a first test at the http://redtube.com scrapping


require 'rubygems'
require 'mechanize'
require 'logger'


agent	= WWW::Mechanize.new
agent.user_agent_alias = 'Mac Safari'
page	= agent.get('http://redtube.com/')

# TODO how to determine the page_idx ?
# - random based on hardcoded max
page_idx	= 2;

page_front	= agent.get("http://redtube.com/?page=#{page_idx}")

# all the links toward the videos watch page
video_arr	= page.links.with.href(%r{/[0-9]+$}).with.text(%r{.+});

if false
	video_arr.each { |video|
		puts("title=#{video.text}")
		pp video
	}
end

page_video	= agent.click video_arr[0];
pp page_video

#
# TODO here the flv url is not directly in the page...
# it seems generated either in javascript or in flash
#