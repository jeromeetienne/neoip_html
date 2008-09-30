#! /usr/bin/env python
from freeetv_t import *
from BeautifulSoup import BeautifulSoup
import urllib2
import simplejson
    

scrapper    = freeetv_t()
url_page    = "http://www.freeetv.com/mod.php?Video_Stream&________________________orderby-4-categoryby-0-newcategoryby-0-presel-moz-d-1"
html_page   = urllib2.urlopen(url_page).read()
#html_page   = open('sample_dirmoz_page_freetv.html').read()
soup        = BeautifulSoup(html_page)

channels    = scrapper.channels_from_dirmoz_page_soup(soup)
# keep only the "Window Media Player" ones
# - i dunno how to parse something else for now
channels    = [channel for channel in channels if channel['stream_type'] == "Windows Media Player"]
#channels    = [channels[0]]
channels    = scrapper.channels_hydrate_stream_uri(channels)

rstream_arr = scrapper.channels_to_rstream_arr(channels)

print simplejson.dumps(rstream_arr, sort_keys=True, indent=4)
