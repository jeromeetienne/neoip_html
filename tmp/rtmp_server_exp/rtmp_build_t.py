#! /usr/bin/env python
#
# \par Brief Description

import StringIO, struct, sys
import os
import pprint


FILTER=''.join([(len(repr(chr(x)))==3) and chr(x) or '.' for x in range(256)])
def hexdump(src, length=16):
    N=0; result=''
    while src:
       s,src = src[:length],src[length:]
       hexa = ' '.join(["%02x"%ord(x) for x in s])
       s = s.translate(FILTER)
       result += "%04X   %-*s   %s\n" % (N, length*3, hexa, s)
       N+=length
    return result

class rtmp_t:
    body_types  = {
        "ping"      : 0x04,
        "serverbw"  : 0x05,
        "clientbw"  : 0x06,
        "audiodata" : 0x08,
        "videodata" : 0x09,
        "notify"    : 0x12,
        "invoke"    : 0x14,
    }
    
    amf0_types  = {
        "number"    : 0x0,
        "boolean"   : 0x1,
        "string"    : 0x2,
        "object"    : 0x3,
        "null"      : 0x5,
        "undefined" : 0x6,
        "object-end": 0x9,
    }


class rtmp_build_t:
    def __init__(self):
        self.output  = StringIO.StringIO()
        
    def rtmp_header(self, channel_id, timestamp, body_size, body_type, stream_id):
        self.output.write(struct.pack('B', channel_id))
        self.output.write(struct.pack('B', (timestamp >> 16) & 0xFF))
        self.output.write(struct.pack('B', (timestamp >>  8) & 0xFF))
        self.output.write(struct.pack('B', (timestamp >>  0) & 0xFF))
        self.output.write(struct.pack('B', (body_size >> 16) & 0xFF))
        self.output.write(struct.pack('B', (body_size >>  8) & 0xFF))
        self.output.write(struct.pack('B', (body_size >>  0) & 0xFF))
        self.output.write(struct.pack('B', body_type))
        self.output.write(struct.pack('>I', stream_id))

    def rtmp_packet(self, channel_id, timestamp, body_type, stream_id, body_data):
        self.rtmp_header(channel_id, timestamp, len(body_data), body_type, stream_id)
        while len(body_data):
            chunk_len   = min(len(body_data), 128)
            self.output.write(body_data[:chunk_len])
            body_data   = body_data[chunk_len:]
            if len(body_data):
                # TODO is this C3 the good one ? especially the channel_id
                self.output.write(struct.pack('B', 0xc3))

    def amf0_type(self, value):
        self.output.write(struct.pack('B', value))

    def amf0_number(self, value):
        self.output.write(struct.pack('>d', value))

    def amf0_boolean(self, value):
        self.output.write(struct.pack('B', int(value)))

    def amf0_string(self, value):
        self.output.write(struct.pack('>H', len(value)))
        self.output.write(struct.pack(str(len(value))+'s', value))
        
    def amf0_element(self, value):
        if( type(value) == int or type(value) == long or type(value) == float ):
            self.amf0_type(rtmp_t.amf0_types['number'])
            self.amf0_number(value)
        elif( type(value) == bool ):
            self.amf0_type(rtmp_t.amf0_types['boolean'])
            self.amf0_boolean(value)
        elif( type(value) == str ):
            self.amf0_type(rtmp_t.amf0_types['string'])
            self.amf0_string(value)
        elif( type(value) == dict ):
            self.amf0_type(rtmp_t.amf0_types['object'])
            for key in value:
                self.amf0_string(key)
                self.amf0_element(value[key])
            self.output.write(struct.pack('>H', 0))
            self.amf0_type(rtmp_t.amf0_types['object-end'])
        elif( value == None ):
            self.amf0_type(rtmp_t.amf0_types['null'])

class rtmp_parse_t:
    def __init__(self, buffer = ''):
        self.input          = StringIO.StringIO(buffer)
        # set the initial value of the last_header
        self.last_header    = {
                        "channel_id"    : None,
                        "timestamp"     : None,
                        "body_size"     : None,
                        "body_type"     : None,
                        "stream_id"     : None,
                    }

    def input_peek(self, size):
        if self.input_remaining() < size:
            raise Exception('buffer too short')
        data    = self.input.read(size)
        self.input.seek(-size, os.SEEK_CUR)
        return data

    def input_read(self, size):
        if self.input_remaining() < size:
            raise Exception('buffer too short')
        data    = self.input.read(size)
        return data

    def input_push(self, data):
        # save the current file position
        old_pos = self.input.pos
        # goto the end of the file
        self.input.seek(0, os.SEEK_END)
        # push the new data
        self.input.write(data)
        # restore the file position
        self.input.seek(old_pos, os.SEEK_SET)
    
    def input_remaining(self):
        return self.input.len - self.input.pos
    
    def del_separator(self, body_size):
        chunk_len   = 128
        nb_sepa     = body_size / chunk_len
        if self.input_remaining() < body_size + nb_sepa:
            raise Exception('buffer too short')        
        for i in xrange(nb_sepa):
            # goto the separator
            self.input.seek(chunk_len+1, os.SEEK_CUR)
            # read all the data after the separator
            data_size   = self.input_remaining()
            data        = self.input.read(data_size)
            self.input.seek(-data_size-1, os.SEEK_CUR)
            # overwrite the separator
            self.input.write(data)
            self.input.seek(-data_size, os.SEEK_CUR)
            # remove the last byte
            self.input.truncate(self.input.len - 1)
        # log to debug
        #print hexdump(self.input.getvalue())
        # restore the file position
        self.input.seek(-nb_sepa * chunk_len, os.SEEK_CUR)

    def rtmp_header(self):
        hdlen_code  = (ord(self.input_peek(1)) >> 6) & 0x3
        hdlen_byte  = [12, 8, 4, 1][hdlen_code]
        data        = self.input_read(hdlen_byte)
        channel_id  = ord(data[0]) & 0x3f
        if hdlen_byte >= 4:
            timestamp   = (ord(data[1]) << 16) + (ord(data[2]) << 8) + (ord(data[3]) << 0)
        else:
            timestamp   = self.last_rtmp_header['timestamp']
        if hdlen_byte >= 8:
            body_size   = (ord(data[4]) << 16) + (ord(data[5]) << 8) + (ord(data[6]) << 0)
            body_type   = ord(data[7])
        else:
            body_size   = self.last_rtmp_header['body_size']
            body_type   = self.last_rtmp_header['body_type']
        if hdlen_byte >= 12:
            stream_id   = (ord(data[8]) << 0) + (ord(data[9]) << 8) + (ord(data[10]) << 16) + (ord(data[11]) << 24)
        else:
            stream_id   = self.last_rtmp_header['stream_id']

        # build the new header
        new_header  = {
                        "channel_id"    : channel_id,
                        "timestamp"     : timestamp,
                        "body_size"     : body_size,
                        "body_type"     : body_type,
                        "stream_id"     : stream_id,
                    }
        # save the new header into the last header
        self.last_rtmp_header    = new_header;
        # return the new header
        return new_header

    def rtmp_packet(self):
        # save the current file position
        old_pos = self.input.pos
        try:
            pkt         = {}
            pkt['header']= self.rtmp_header()
            self.del_separator(pkt['header']['body_size'])
            pkt['body'] = self.input_read(pkt['header']['body_size'])
            return pkt
        except Exception, e:
            # restore the file position
            self.input.seek(old_pos, os.SEEK_SET)
        return None
    
    def amf0_unpack_raw(self, fmt):
        len     = struct.calcsize(fmt)
        data    = self.input.read(len)
        return struct.unpack(fmt, data)[0]

    def amf0_type(self):
        return self.amf0_unpack_raw('B')
    
    def amf0_number(self):
        return self.amf0_unpack_raw('>d')

    def amf0_boolean(self):
        return bool(self.amf0_unpack_raw('B'))

    def amf0_string(self):
        len = self.amf0_unpack_raw('>H')
        return self.amf0_unpack_raw('%ss' % len)

    def amf0_object(self):
        result  = {}
        # loop for all the keys
        while True:
            # read the key of the object
            key = self.amf0_string()
            # if it is the end of the object, leave the loop
            if( len(key) == 0 and ord(self.input_peek(1)) == rtmp_t.amf0_types['object-end'] ):
                break
            # read the value associated with the key
            val = self.amf0_element()
            # populate the result with the key: value
            result[key] = val
        # return the just-built object
        return result

    def amf0_element(self):
        elemtype    = self.amf0_type()
        if( elemtype == rtmp_t.amf0_types['number']):
            return self.amf0_number()
        elif( elemtype == rtmp_t.amf0_types['boolean']):
            return self.amf0_boolean()
        elif( elemtype == rtmp_t.amf0_types['string']):
            return self.amf0_string()
        elif( elemtype == rtmp_t.amf0_types['object']):
            return self.amf0_object()

if __name__=='__main__':
    fdata   = open('data_rtmp_connect')
    parser  = rtmp_parse_t()
    parser.input_push( fdata.read() )
    rtmp_packet = parser.rtmp_packet()
    pprint.pprint(rtmp_packet)
    sys.exit(0)
    # one attempts to handle the parsing in one shot
    parser  = rtmp_parse_t(open("data_rtmp_connect").read())
    rtmp_header = parser.rtmp_header()
    parser.del_separator(rtmp_header['body_size'])
    pprint.pprint(rtmp_header)
    key = parser.amf0_element()
    pprint.pprint(key)
    key = parser.amf0_element()
    pprint.pprint(key)
    key = parser.amf0_element()
    pprint.pprint(key)
    sys.exit(0)
    # build an example of "connect" reply
    builder = rtmp_build_t()
    builder.amf0_element("_result")
    builder.amf0_element(1)
    builder.amf0_element(None)
    builder.amf0_element( {
                'application'   : None,
                'level'         : 'status',
                'description'   : 'Connection succeeded.',
                'code'          : 'NetConnection.Connect.Success'
                })
    body_data   = builder.output.getvalue();

    builder = rtmp_build_t()
    builder.rtmp_packet(channel_id=3, timestamp=0, body_type=0x14, stream_id=0, body_data=body_data)
    print "packet:"
    print hexdump(builder.output.getvalue())
    
        
        
