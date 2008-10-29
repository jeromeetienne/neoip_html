#! /usr/bin/env python

# import needed modules
import urllib, urllib2
import simplejson

class rstream_websrv_t:
    """
    This class is a easy access to the rstream webservice
    - just a prototype for now
    """

    # define the url root
    websrv_urlroot  = "http://rstream.urfastr.net/rstream_api"
    #websrv_urlroot  = "http://localhost/~jerome/rstream_websrv/index.php/rstream_api"

    def search(self):
        "search the remote stream database"
        url_cmd     = self.websrv_urlroot + "/search"
        json_data   = urllib2.urlopen(url_cmd).read()    
        return simplejson.loads(json_data)

    def create(self, rstream):
        url_cmd     = self.websrv_urlroot + "/create"
        data_post   = urllib.urlencode(rstream)
        urllib2.urlopen(url_cmd, data_post).read()
        
    def read(self, cast_name):
        url_cmd     = self.websrv_urlroot + "/read"
        data_post   = urllib.urlencode({'cast_name' : cast_name})
        json_data   = urllib2.urlopen(url_cmd, data_post).read()
        return simplejson.loads(json_data)

    def update(self, rstream):
        url_cmd     = self.websrv_urlroot + "/update"
        data_post   = urllib.urlencode(rstream)
        urllib2.urlopen(url_cmd, data_post).read()

    def delete(self, cast_name):
        url_cmd     = self.websrv_urlroot + "/delete"
        data_post   = urllib.urlencode({'cast_name' : cast_name})
        urllib2.urlopen(url_cmd, data_post).read()
        




