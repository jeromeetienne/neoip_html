#! /usr/bin/env python
#
# \par Brief Description
# this script is an experimentation to write dummy rtmp server
# this is a prototype which aims to provide understanding of rtmp
# to be able to code the rtmp webcam reading into webpack


import gobject, socket, pyamf
import StringIO, struct, sys, time
import pprint
import rtmp_build_t

sock_state  = "listening"
input_buf   = pyamf.util.BufferedByteStream()
rtmp_parser = rtmp_build_t.rtmp_parse_t()
flv_output  = open("/tmp/rtmp_experiment.flv", "w+")
flv_prev_chunksize  = 0
flv_start_tstamp    = None
 
def server(host, port):
    '''Initialize server and start listening.'''
    sock = socket.socket()
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((host, port))
    sock.listen(1)
    print "Listening..."
    gobject.io_add_watch(sock, gobject.IO_IN, listener)

 
def listener(sock, *args):
    '''Asynchronous cnxection listener. Starts a handler for each cnxection.'''
    global sock_state
    cnx, addr = sock.accept()
    sock_state  = "handshake_itor_wait"
    print "Connected"
    gobject.io_add_watch(cnx, gobject.IO_IN, handler)
    return True

# --------------------------------------------------------------------------
# This GREAT hexdump function from Sebastian Keim's Python recipe at:
# http://aspn.activestate.com/ASPN/Cookbook/Python/Recipe/142812
# --------------------------------------------------------------------------
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

def build_serverbw():
    output      = StringIO.StringIO();
    output.write(struct.pack('>I', 250000))
    body_data   = output.getvalue()

    builder = rtmp_build_t.rtmp_build_t()
    builder.rtmp_packet(channel_id=2, timestamp=0, body_type=0x05, stream_id=0, body_data=body_data)
    return builder.output.getvalue();

def build_clientbw():
    output      = StringIO.StringIO();
    output.write(struct.pack('>I', 250000))
    output.write(struct.pack('B', 2))
    body_data   = output.getvalue()

    builder = rtmp_build_t.rtmp_build_t()
    builder.rtmp_packet(channel_id=2, timestamp=0, body_type=0x06, stream_id=0, body_data=body_data)
    return builder.output.getvalue();

def build_connect_resp():
    # build an example of "connect" reply
    builder = rtmp_build_t.rtmp_build_t()
    builder.amf0_element("_result")
    # 1 ? would be the connect id
    # from the connect invoke
    builder.amf0_element(1)
    builder.amf0_element(None)
    builder.amf0_element({
                'level'         : 'status',
                'description'   : 'Connection succeeded.',
                'code'          : 'NetConnection.Connect.Success'
                })
    body_data   = builder.output.getvalue();

    builder = rtmp_build_t.rtmp_build_t()
    builder.rtmp_packet(channel_id=3, timestamp=0, body_type=0x14, stream_id=0, body_data=body_data)
    return builder.output.getvalue();

def build_createstream_resp():
    # build an example of "connect" reply
    builder = rtmp_build_t.rtmp_build_t()
    builder.amf0_element("_result")
    # 1 ? would be the connect id
    # from the connect invoke
    builder.amf0_element(2)
    builder.amf0_element(None)
    builder.amf0_element(1)
    body_data   = builder.output.getvalue();

    builder = rtmp_build_t.rtmp_build_t()
    builder.rtmp_packet(channel_id=3, timestamp=0, body_type=0x14, stream_id=0, body_data=body_data)
    return builder.output.getvalue();

def flv_init():
    global flv_output
    # FLV
    flv_output.write(struct.pack('3s', 'FLV'))
    # version
    flv_output.write(struct.pack('B', 0x01))
    # type : audio and video
    flv_output.write(struct.pack('B', 0x05))
    # header length, always 9
    flv_output.write(struct.pack('>I', 0x00000009))
    flv_output.flush()

def flv_dump_tag(body_type, rtmp_timestamp, body_data):
    global flv_output, flv_prev_chunksize, flv_start_tstamp
    flv_output.write(struct.pack('>I', flv_prev_chunksize))
    body_size   = len(body_data)
    flv_prev_chunksize = body_size + 11
    print "flv_start_tstamp=" + str(flv_start_tstamp) + "\n"
    if( flv_start_tstamp == None ):
        flv_start_tstamp    = int(time.time()*1000)
    # TODO rtmp_timestamp seems to be the relative timestamp and the flv one is the absolute
    # - maybe the very first after the connection is the absolute one
    print "rtmp_timestamp=" + str(rtmp_timestamp) + "\n"
    timestamp = int(time.time()*1000) - flv_start_tstamp
    print "timestamp=" + str(timestamp) + "\n"
    flv_output.write(struct.pack('B', body_type))
    flv_output.write(struct.pack('B', (body_size >> 16) & 0xFF))
    flv_output.write(struct.pack('B', (body_size >>  8) & 0xFF))
    flv_output.write(struct.pack('B', (body_size >>  0) & 0xFF))
    flv_output.write(struct.pack('B', (timestamp >> 16) & 0xFF))
    flv_output.write(struct.pack('B', (timestamp >>  8) & 0xFF))
    flv_output.write(struct.pack('B', (timestamp >>  0) & 0xFF))
    flv_output.write(struct.pack('>I', 0))
    flv_output.write(struct.pack(str(len(body_data))+'s', body_data))
    flv_output.flush()
                
def handler(cnx, *args):
    '''Asynchronous cnxection handler. Processes each line from the socket.'''
    global sock_state, input_buf, rtmp_parser
    line = cnx.recv(4096)
    print "just received %d-byte in state %s" % (len(line), sock_state)
    # if the connection has been closed, return now
    if not len(line):
        print "Connection closed."
        return False
    # append the newly read data to the input buffer
    input_buf   = pyamf.util.BufferedByteStream(input_buf.read() + line)

    if sock_state == "handshake_itor_wait":
        if input_buf.remaining() < 1537:
            return True
        # change the state
        sock_state  = "handshake_resp_sent"
        # read the handshake itor
        handshake_itor  = input_buf.read(1537)
        # send a handshake resp
        cnx.send("\3" + "\0" * 1536)
        cnx.send(handshake_itor[1:1537])
    if sock_state == "handshake_resp_sent":
        if input_buf.remaining() < 1536:
            return True
        # change the state
        sock_state  = "connected"
        # discard the whole, it is the 1536 \0 i sent
        input_buf.read(1536)
        # init the flv_output
        flv_init()
    if sock_state == "connected":
        # push all the input_buf in the rtmp_parser
        rtmp_parser.input_push( input_buf.read() )
        packet  = rtmp_parser.rtmp_packet()
        if packet == None:
            print "rtmp_packet no fully received. Current data:\n"
            tmp = rtmp_parser.input_peek(rtmp_parser.input_remaining())
            #print hexdump(tmp)
            #open("/tmp/slota", "w+").write(tmp)
            #sys.exit(-1)
            return True
        body_type   = packet['header']['body_type']
        #pprint.pprint(packet)
        if body_type == rtmp_build_t.rtmp_t.body_types['invoke']:
            body_parser = rtmp_build_t.rtmp_parse_t(packet['body'])
            fct_name    = body_parser.amf0_element()
            print "fct_name=" + fct_name + "() with the header"
            pprint.pprint(packet['header'])
            if fct_name == "connect":
                param0  = body_parser.amf0_element();
                param1  = body_parser.amf0_element();
                pprint.pprint(param0)
                pprint.pprint(param1)
                reply_data  = ''
                #reply_data  += build_serverbw()
                #reply_data  += build_clientbw()
                reply_data  += build_connect_resp()
                cnx.send(reply_data)
                print "reply to "+ fct_name + "():\n" + hexdump(reply_data)
            elif fct_name == "createStream":
                param0  = body_parser.amf0_element();
                param1  = body_parser.amf0_element();
                print "slota createStream=\n" + hexdump(packet['body'])
                reply_data  = build_createstream_resp()
                cnx.send(reply_data)
                print "reply to "+ fct_name + "():\n" + hexdump(reply_data)
        elif body_type == rtmp_build_t.rtmp_t.body_types['videodata'] or body_type == rtmp_build_t.rtmp_t.body_types['audiodata']:
            body_type   = packet['header']['body_type']
            timestamp   = packet['header']['timestamp']
            body_data   = packet['body']
            print "body_type=" + str(packet['header']['body_type']) + " size=" + str(len(body_data)) + "\n"
            #print hexdump(body_data)
            flv_dump_tag(body_type, timestamp, body_data)
                


    print "sock_state is now %s and %s-byte remaing in the input buffer" % (sock_state, input_buf.remaining())
    #print hexdump(input_buf.peek(input_buf.remaining()))
    return True

if __name__=='__main__':
    server('', 1935)
    gobject.MainLoop().run()
    