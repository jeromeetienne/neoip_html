#!/usr/bin/ruby

require "socket"
dts	= TCPServer.new('localhost', 20000)  
loop do  
	Thread.start(dts.accept) do |s|  
		print(s, " is accepted\n")  
		s.write(Time.now)  
		print(s, " is gone\n")  
		s.close  
	end  
end
	