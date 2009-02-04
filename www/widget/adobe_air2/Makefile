# very raw Makefile to compile the air application
# - to run the application, simply do
#   $ adl application.xml

APPS_FNAME=urfastr-player.air
APPS_ID=com.urfastr.player

# TODO put adt in a more regular path
#ADT=~/opt/adobeair_linux_sdk_b1_091508/bin/adt
ADT=~/opt/adobeair_1.5_sdk/bin/adt


package:
	echo "jme the password is 'password'"
	$(ADT) -package -storetype pkcs12 -keystore cert.pfx $(APPS_FNAME) application.xml .
	
install:
	Adobe\ AIR\ Application\ Installer $(PWD)/$(APPS_FNAME)

uninstall:
	-sudo dpkg -r `dpkg -l | grep $(APPS_ID) | tr -s ' ' | cut -d' ' -f 2`

clean:
	rm -f $(APPS_FNAME)