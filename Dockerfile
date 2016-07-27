FROM resin/armv7hf-debian-qemu

RUN [ "cross-build-start" ]

RUN mkdir -p /go
ADD . /go

WORKDIR /go

CMD ["/go/raspi-tp"]

RUN [ "cross-build-end" ]

EXPOSE 80
