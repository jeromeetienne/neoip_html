# very raw Makefile to compile the air application


APPS_FNAME=urfastr-player.air
# TODO put adt in a more regular path
ADT=~/opt/adobeair_linux_sdk_b1_091508/bin/adt

$(APPS_FNAME): application.xml index.html
	echo "jme the password is 'password'"
	$(ADT) -package -storetype pkcs12 -keystore cert.pfx $(APPS_FNAME) application.xml .
	
clean:
	rm -f $(APPS_FNAME)