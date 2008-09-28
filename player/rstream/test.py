#! /usr/bin/env python
from BeautifulSoup import BeautifulSoup
import urllib2
import re, sys
from freeetv_parser_t import *
import simplejson

#url_page     = "http://www.freeetv.com/modules.php?name=Video_Stream&page=watch&id=2216"
#url_stream   = streamurl_from_watchurl(url)
#print "url_stream=%s" % url_stream


scrapper    = freeetv_parser_t()

url_page    = "http://www.freeetv.com/mod.php?Video_Stream&________________________orderby-4-categoryby-8-newcategoryby-0-presel-moz"
html_page   = urllib2.urlopen(url_page).read()
#html_page   = open('sample_dirmoz_page_freetv.html').read()
soup        = BeautifulSoup(html_page)

channels    = scrapper.channels_from_dirmoz_page_soup(soup)
# keep only the "Window Media Player" ones
# - i dunno how to parse something else for now
channels    = [channel for channel in channels if channel['stream_type'] == "Windows Media Player"]
#channels    = [channels[0]]
channels    = scrapper.channels_hydrate_stream_uri(channels)

for channel in channels:
    print channel

rstream_arr = scrapper.channels_to_rstream_arr(channels)

sys.stderr.write(simplejson.dumps(rstream_arr, sort_keys=True, indent=4))

#url_stream  = scrapper.streamurl_from_watchurl(channels[0]['watchpage_url'])
#print "url_stream=%s" % url_stream

#pageinfo    = pageinfo_from_dirmoz_page_soup(soup)
#print pageinfo
