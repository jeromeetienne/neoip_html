#! /usr/bin/env python
from BeautifulSoup import BeautifulSoup
import urllib2
import re, sys
from freeetv_t import *
import simplejson

#url_page     = "http://www.freeetv.com/modules.php?name=Video_Stream&page=watch&id=2216"
#url_stream   = streamurl_from_watchurl(url)
#print "url_stream=%s" % url_stream

freeetv     = freeetv_t()
channels    = freeetv.channels_from_criteria()
channels    = freeetv.channels_hydrate_stream_uri(channels)

sys.stderr.write(simplejson.dumps(channels, sort_keys=True, indent=4))


freeetv     = freeetv_t()
pageidx     = 1
pagemax     = None
channels    = []
while True:
    print "pageidx=" + pageidx.__str__()
    # build the url for the dirpage
    url_dirpage = freeetv.build_uri_dirpage(pageidx=pageidx);
    print "url_dirpage=" + url_dirpage
    # read and parse the dirpage
    page_html   = urllib2.urlopen(url_dirpage).read()
    page_soup   = BeautifulSoup(page_html)
    # extract the channels from this directory
    new_channels= freeetv.channels_from_dirmoz_page_soup(page_soup)
    channels    += new_channels
    # if pagemax is not yet known, get it
    if pagemax == None :
        pagemax     = freeetv.pagemax_from_dirmoz_page_soup(page_soup)
        print "pagemax=" + pagemax
    # if this was the last page, leave the loop
    if pageidx == pagemax:  break
    # goto the next page
    pageidx += 1

sys.exit(0)

freeetv     = freeetv_parser_t()
url_dirpage = freeetv.build_uri_dirpage(location='france');

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
