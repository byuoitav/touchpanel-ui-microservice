FROM resin/armv7hf-debian-qemu

RUN [ "cross-build-start" ]

RUN mkdir -p /go
ADD raspi-tp /go

WORKDIR /go

CMD ["/go/raspi-tp"]

RUN [ "cross-build-end" ]
