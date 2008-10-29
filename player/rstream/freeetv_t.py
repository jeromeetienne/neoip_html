#! /usr/bin/env python
# - TODO write a unit test for it

# import needed modules
from BeautifulSoup import BeautifulSoup
import urllib2
import re

class freeetv_t:
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
    
    location_arr  = {   'afghanistan': 53,
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
    category_arr = {    'all': 0,
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
    order_arr   =     { 'alphabetically': 4,
                        'highest rated': 2,
                        'most viewed': 3,
                        'newest': 0,
                        'oldest': 1     }

    def _parse_options(self, attr_name):
        url_page    = self.build_uri_dirpage()
        html_page   = urllib2.urlopen(url_page).read()
        page_soup   = BeautifulSoup(html_page)
        options     = page_soup.find('select', {'name': attr_name}).findAll('option')
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

    def build_uri_dirpage(self, order='alphabetically', location='all', category='all', pageidx=1):
        url_page     ="http://www.freeetv.com/mod.php?Video_Stream&________________________"
        url_page    +="orderby-"        + str(self.order_arr[order])
        # the website call "category" the location... no idea why 
        url_page    +='-categoryby-'    + str(self.location_arr[location])
        # the website call "newcategory" the category... no idea why 
        url_page    +='-newcategoryby-' + str(self.category_arr[category])
        url_page    +='-presel-moz'
        url_page    +='-d-'             + str(pageidx)
        return url_page

    def streamurl_from_watchurl(self, url):
        '''Return the stream's url from a watch page url'''
        html_page   = urllib2.urlopen(url).read()
        soup        = BeautifulSoup(html_page)
        streamurl   = soup.find('object').findNext('object').findAll('param', attrs={"name":"URL"})[0]['value']
        # return the just-scrapped url
        return streamurl

    def channels_from_criteria(self, location='all', category='all'):
        'Get all channel for given criteria'
        pageidx     = 1
        pagemax     = None
        channels    = []
        while True:
            #print "pageidx=" + pageidx.__str__()
            # build the url for the dirpage
            url_dirpage = self.build_uri_dirpage(location=location, category=category, pageidx=pageidx);
            #print "url_dirpage=" + url_dirpage
            # read and parse the dirpage
            page_html   = urllib2.urlopen(url_dirpage).read()
            page_soup   = BeautifulSoup(page_html)
            # extract the channels from this directory
            new_channels= self.channels_from_dirmoz_page_soup(page_soup)
            channels    += new_channels
            # if pagemax is not yet known, get it
            if pagemax == None :
                pagemax     = self.pagemax_from_dirmoz_page_soup(page_soup)
                #print "pagemax=" + pagemax.__str__()
            # if this was the last page, leave the loop
            if pageidx == pagemax:  break
            # goto the next page
            pageidx += 1
        # return the just built array
        return channels
    
    def channels_from_dirmoz_page_soup(self, page_soup):
        '''returns the list of channel from a directory page in mozaic'''
        channels    = []
        results     = page_soup.find("script", {"src":"http://pagead2.googlesyndication.com/pagead/show_ads.js"}).findAllNext('a')
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
            name_location           = images[0]['alt'].encode('ascii', 'replace')
            name_location_re        = re.search('(.*) \((.*)\)', name_location)
            if name_location_re != None :
                channel['human_name']   = name_location_re.group(1).strip()
                channel['location']     = name_location_re.group(2).lower()
            else:
                channel['human_name']   = name_location.strip()
                channel['location']     = "unknown"
            channels.append(channel)
            #print "channel=%s" % channel
        return channels
    
    def pagemax_from_dirmoz_page_soup(self, page_soup):
        '''get information about the page indexes (cur/max) on a mosaic directory'''
        page_text   = page_soup.findAll(text=re.compile("^Page "));
        page_re     = re.search('Page ([0-9]+)/([0-9]+)', page_text[0])
        # NOTE: there is a bug in the website
        # - the current page number is always +1 the actual one
        # - except when it is the last page
        # - i simply ignored the data as it was confusing
        page_cur    = page_re.group(1)
        page_max    = page_re.group(2)
        return int(page_max)

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
            rstream['cast_name']    = channel['human_name'].encode('ascii', 'replace').replace(' ', '_') + '.flv'
            rstream['stream_uri']   = channel['stream_uri']
            rstream_arr.append( rstream )
        return rstream_arr
        	





