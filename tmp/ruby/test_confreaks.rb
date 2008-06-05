#!/usr/bin/ruby
#


require 'rubygems'
require 'hpricot'
require 'open-uri'


def parse_track_page(base_uri, page_uri)
	track_uri	= page_uri
	track_html	= Hpricot(open(track_uri))
	
	track_author	= (track_html/"span.caption")[0].inner_html
	track_title	= (track_html/"h2")[1].inner_html
	
	script_txt	= (track_html/"script")[1].inner_html
	track_content	= base_uri + script_txt.match(/file=(.*?)&/)[1]
	track_thumbnail	= base_uri + script_txt.match(/&image=(.*?)\"/)[1]
	
	puts "track_author=#{track_author}"
	puts "track_title=#{track_title}"
	puts "track_content=#{track_content}"
	puts "track_thumbnail=#{track_thumbnail}"
end

base_uri	= "http://mtnwestrubyconf2007.confreaks.com/"
#base_uri	= "http://rubyhoedown2007.confreaks.com/"
#base_uri	= "http://rejectconf4.confreaks.com/"
#base_uri	= "http://rubyconf2007.confreaks.com/"
base_doc	= Hpricot(open(base_uri))


every_raw	= (base_doc/"table/tr")
every_raw.shift

track_pages	= every_raw.collect { |raw|
	begin
		base_uri + (raw/"td/a")[0].attributes['href']
	rescue => e
		nil
	end
}

# delete all the one which failed
track_pages.delete(nil)

track_pages.each { |track_page_uri| parse_track_page(base_uri, track_page_uri) }


exit


every_raw.each { |raw|
	begin
		track_author	= (raw/"td")[0].inner_html
		track_title	= (raw/"td/a").inner_html
		track_uri	= (raw/"td/a")[0].attributes['href']
		puts "***********";
		puts "author=#{track_author}"
		puts "title=#{track_title}"
		puts "track_uri=#{track_uri}"
	rescue => e
	end
}

exit



# init the WWW::mechanize agent
agent		= WWW::Mechanize.new
agent.user_agent_alias = 'Mac Safari'

list_page	= agent.get(base_uri)

conf_links	= list_page.links.with.href(%r{\.html})

conf_links.each { |conf_link|
	puts conf_link.text
}

conf_link	= conf_links[0];
link_page	= agent.click(conf_link)