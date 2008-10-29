#! /usr/bin/env python
#
# \par Brief Description
# this scripts refresh rstream's streambility

# import needed modules
from rstream_websrv_t import rstream_websrv_t
import sys, os
import subprocess
import simplejson
import time

# get the data from the input
data_str    = sys.stdin.read()
data_json   = simplejson.loads(data_str)
rstream_arr = data_json

# create the web service API
websrv      = rstream_websrv_t()

# steps
for rstream in rstream_arr:
    #print "cast_name=" + rstream['cast_name'] + " stream_uri=" + rstream['stream_uri']
    errcode = subprocess.call(["./stream_uri_may_stream.rb", rstream['stream_uri']]
                                , stdout=open(os.devnull), stderr=open(os.devnull))
    rstream['stream_possible']  = errcode == 0
    rstream['stream_tested_at'] = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime());

print simplejson.dumps(rstream_arr, sort_keys=True, indent=4)
