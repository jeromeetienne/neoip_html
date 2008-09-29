#! /usr/bin/env python
# - TODO write a unit test for it

# import needed modules
from BeautifulSoup import BeautifulSoup
import urllib2
import re

class freeetv_parser_t:
    """
    Note about the freeetv.com url format for directory:
    - presel is view mode for the directory
      * presel-list: it is a text view. no icon
      * presel-moz: it has large icons and a little text (title, location)
      * presel-minipic: it is icon only
        o warning: minipic is called "mosaic" on the site
          and moz is called "big pic"
    - orderby: this is the order to sort
    - categoryby: this is the location/language of the stream
    - newcategoryby: this is the actual category
    """
    
    categoryby_arr  = { 'afghanistan': 53,
                        'africa': 25,
                        'all': 0,
                        'argentina': 43,
                        'asia': 16,
                        'brazil': 29,
                        'canada': 27,
                        'china': 42,
                        'east europe': 35,
                        'europe': 14,
                        'france et francophones': 8,
                        'germany': 21,
                        'india': 48,
                        'iran': 51,
                        'italy': 24,
                        'japan': 22,
                        'mexico': 45,
                        'mideast': 31,
                        'netherlands': 30,
                        'not working': 50,
                        'poland': 47,
                        'portugal': 49,
                        'russian federation': 36,
                        'south america': 28,
                        'south korea': 52,
                        'spain': 32,
                        'the world': 34,
                        'turkey': 41,
                        'ukraine': 44,
                        'united kingdom': 33,
                        'usa': 13,
                        'venezuela': 46 }
    newcategoryby_arr = {
                        'all': 0,
                        'entertainment': 52,
                        'financial': 61,
                        'general': 48,
                        'kids': 59,
                        'local': 55,
                        'movies': 63,
                        'music': 58,
                        'news': 51,
                        'religious': 47,
                        'specialized ': 56,
                        'sport': 57,
                        'tele shopping': 49,
                        'weather': 62,
                        'webcam': 53,
                        'zoo cam': 54   }
    orderby_arr     = { 'alphabetically': 4,
                        'highest rated': 2,
                        'most viewed': 3,
                        'newest': 0,
                        'oldest': 1     }

    def _parse_options(self, attr_name):
        url_page    = "http://www.freeetv.com/mod.php?Video_Stream&________________________orderby-4-categoryby-8-newcategoryby-0-presel-moz"
        html_page   = urllib2.urlopen(url_page).read()
        soup_page   = BeautifulSoup(html_page)
        options     = soup_page.find('select', {'name': attr_name}).findAll('option')
        result      = {}
        for option in options:
            print option
            val     = int(option['value'])
            key     = option.find(text=True).lower().encode('ascii')
            result[key] = val
        return result

    def parse_orderby(self):
        'extract the code for the orderby variable in directory uri'
        return self._parse_options("orderby")

    def parse_categoryby(self):
        'extract the code for the categoryby variable in directory uri'
        return self._parse_options("categoryby")

    def parse_newcategoryby(self):
        'extract the code for the newcategoryby variable in directory uri'
        return self._parse_options("newcategoryby")

    def build_uri_dirpage(self, order='alphabetically', location='all', category='all'):
        url_page     ="http://www.freeetv.com/mod.php?Video_Stream&________________________"
        url_page    +="orderby-"        + str(self.orderby_arr[order])
        url_page    +='-categoryby-'    + str(self.categoryby_arr[location])
        url_page    +='-newcategoryby-' + str(self.newcategoryby_arr[category])
        url_page    +='-presel-moz'
        return url_page

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
        	





