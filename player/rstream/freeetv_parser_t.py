#! /usr/bin/env python
# - TODO write a unit test for it

# import needed modules
from BeautifulSoup import BeautifulSoup
import urllib2
import re

class freeetv_parser_t:
    def streamurl_from_watchurl(self, url):
        '''Return the stream's url from a watch page url'''
        html_page   = urllib2.urlopen(url).read()
        soup        = BeautifulSoup(html_page)
        streamurl   = soup.find('object').findNext('object').findAll('param', attrs={"name":"URL"})[0]['value']
        # return the just-scrapped url
        return streamurl
    
    def channels_from_dirmoz_page_soup(self, soup_page):
        '''returns the list of channel from a directory page in mozaic'''
        channels    = []
        results     = soup_page.find("script", {"src":"http://pagead2.googlesyndication.com/pagead/show_ads.js"}).findAllNext('a')
        for result in results :
            images  = result.findAll('img')
            if images == [] :               continue
            if result['href'] == "#top" :   break
            channel                 = {}
            channel['icon_url']     = images[0]['src']
            channel['stream_type']  = "unknown"
            # sometime it is not present - e.g. when there is no icon for the channel
            if len(images) >= 2 :
                channel['stream_type']  = images[1]['alt']
            channel['watchpage_url']= "http://www.freeetv.com/" + result['href']
            name_location           = images[0]['alt']
            name_location_re        = re.search('(.*) \((.*)\)', name_location)
            channel['name']         = name_location_re.group(1)
            channel['location']     = name_location_re.group(2)
            channels.append(channel)
            #print "channel=%s" % channel
        return channels
    
    def pageinfo_from_dirmoz_page_soup(self, soup_page):
        '''get information about the page indexes (cur/max) on a mosaic directory'''
        page_text   = soup.findAll(text=re.compile("^Page "));
        page_re     = re.search('Page ([0-9]+)/([0-9]+)', page_text[0])
        page_cur    = page_re.group(1)
        page_max    = page_re.group(2)
        return { 'cur' : int(page_cur), 'max' : int(page_max) }

    def channels_hydrate_stream_uri(self, channels):
        'determine and set the stream_uri for each channel'
        for channel in channels :
            stream_uri  = self.streamurl_from_watchurl(channel['watchpage_url'])
            #print "stream_uri=" + stream_uri
            channel['stream_uri']   = stream_uri
        return channels

    def channels_to_rstream_arr(self, channels):
        rstream_arr = []
        for channel in channels :
            rstream = {}
            rstream['cast_name']    = channel['name'].encode('ascii', 'replace').replace(' ', '_') + '.flv'
            rstream['stream_uri']   = channel['stream_uri']
            rstream_arr.append( rstream )
        return rstream_arr
        	





