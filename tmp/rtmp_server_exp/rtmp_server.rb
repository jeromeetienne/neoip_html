#!/usr/bin/ruby

def hex_dump(str)
	i = 0
	while(i*16 < str.size) do
		a	= str[i*16,16]	# take up to 16 chars
		a	= a.split(//).map{|c| c[0]}
		printf("%04X   ", i*16);
		printf("%02X " * a.length, *a);
		printf("   " * (16-a.length));
		a.each{ |c|
			c = c < 32 || c > 127 ? '.'[0] : c;
			printf("%c",c);
		}
		printf("\n");
		i += 1
	end
end


# In one script, start this first
require 'socket'
include Socket::Constants

puts "start listening"

# listen on the rtmp port 1935
socket		= Socket.new( AF_INET, SOCK_STREAM, 0 )
sockaddr	= Socket.pack_sockaddr_in( 1935, 'localhost' )
socket.setsockopt(Socket::SOL_SOCKET,Socket::SO_REUSEADDR, true)
socket.bind( sockaddr )
socket.listen( 5 )
client, client_sockaddr = socket.accept

puts client.class

# read the client handshake_request
data = client.recvfrom(1536+1)[0]
client_handshake_data	= data[1..1537]
puts "client handshake request recved: first byte=#{data[0].to_i}"
puts client_handshake_data.length

# write the server handshake response
client.write "\3"
client.write "\0" * 1536
client.write client_handshake_data;

# read the client handshake acknowledge
data	= client.recvfrom(1536)[0]
puts "data is a #{data.class} and is long of #{data.length}"

while true
	data	= client.recvfrom(10000)[0]
	hex_dump data
	puts "data is a #{data.class} and is long of 0x#{data.length.to_s(16)}"
end

socket.close


