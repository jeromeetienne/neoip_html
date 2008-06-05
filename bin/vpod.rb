#!/usr/bin/ruby
require 'net/http'
require 'rubygems'
require 'json'
require 'pp'


vpod_req	= 'SearchVideos [{"keywords":["rodrigo"],"keywordsCategories":["title","description"],"limit":null,"matchScores"' +
		':false,"order":{"desc":true,"orderBy":"UPLOAD_DATE"},"position":{"count":20,"start":0},"private":false' + 
		',"tags":[]}]';
vpod_url	= URI.parse('http://vpod.tv/services')
		
puts "#{vpod_req}"

vpod_rep	= {}
res	= Net::HTTP.new('vpod.tv', 80).start { |http|
	response	= http.request_post('/services', vpod_req)
	vpod_rep	= JSON.parse(response.body)
}


video_arr	= vpod_rep[0]['data']['videos'];

video_arr.each { |video|
	puts "**************"
	video_title	= video[1]['title']
	video_url	= video[1]['formats']['web'][0]['url']
	puts "'#{video_title}' at #{video_url}"	
}
