#!/usr/bin/ruby


require 'rubygems'
require 'mechanize'
require 'logger'
require 'pp'

# init the WWW::mechanize agent
agent		= WWW::Mechanize.new{ |a| a.log = Logger.new("/tmp/mechanize.log") }
agent.user_agent_alias = 'Windows IE 6'
# get passed the 'age confirmation' page to reach the initial page
page_ageconfirm	= agent.get('http://youporn.com/')
form		= page_ageconfirm.forms[0]
page_init	= agent.submit(form, form.buttons.first)

# this page contains a cookie added in javascript, so it is manually added here
cookie_str	= "age_check=1; expires=#{Time.now + (10 * 86400)};"
url		= URI.parse('http://youporn.com/')
WWW::Mechanize::Cookie.parse(url, cookie_str) { |cookie|
	agent.cookie_jar.add(url, cookie)
}


# get the number of page from the initial page
page_idxmax	= page_init.links.with.href(%r{\?page=}).collect{ |link| 
			link.href.split("=")[1]
		}.max
# pick a page at random
puts "page_idxmax=#{page_idxmax}"
page_idx	= rand(page_idxmax);

puts "page_idx=#{page_idx}"
page_front	= agent.get("/?page=2")
pp page_front

# all the links toward the videos watch page
video_arr	= page_front.links.with.href(%r{watch}).with.text("\n\t\n")

puts "video_arr=#{video_arr.length}"