# very raw Makefile to compile the air application
# - to run the application, simply do
#   $ adl application.xml

APPS_FNAME=urfastr-player.air
# TODO put adt in a more regular path
#ADT=~/opt/adobeair_linux_sdk_b1_091508/bin/adt
ADT=~/opt/air_1.5_sdk/bin/adt



$(APPS_FNAME): application.xml index.html
	echo "jme the password is 'password'"
	$(ADT) -package -storetype pkcs12 -keystore cert.pfx $(APPS_FNAME) application.xml .
	
clean:
	rm -f $(APPS_FNAME)