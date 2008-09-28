#! /usr/bin/env python

# import needed modules
from rstream_websrv_t import rstream_websrv_t
import simplejson
import sys

# get the data from the input
data_str    = sys.stdin.read()
data_json   = simplejson.loads(data_str)

# create the web service API
websrv      = rstream_websrv_t()

# create all the rstream from the input file
rstream_arr = data_json
for rstream in rstream_arr :
    print "create the remote server with cast_name " + rstream['cast_name']
    websrv.create(rstream)




