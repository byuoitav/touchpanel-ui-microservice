FROM resin/armv7hf-debian-qemu

RUN [ "cross-build-start" ]

RUN apt-get update && apt-get install -y

RUN mkdir /go/bin
COPY raspi-tp /go/bin

CMD ["/go/bin/raspi-tp"]

RUN [ "cross-build-end" ]

EXPOSE 9000
