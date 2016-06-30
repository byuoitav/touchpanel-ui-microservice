FROM resin/armv7hf-debian-qemu

RUN [ "cross-build-start" ]

RUN apt-get update && apt-get upgrade -y

RUN mkdir -p /go/bin
COPY raspi-tp /go/bin

CMD ["/go/bin/raspi-tp"]

RUN [ "cross-build-end" ]

EXPOSE 9000
