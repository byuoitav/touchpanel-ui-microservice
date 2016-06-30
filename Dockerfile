FROM hypriot/rpi-alpine-scratch

RUN apk update && apk upgrade

RUN mkdir /go/bin
COPY raspi-tp /go/bin

CMD ["/go/bin/raspi-tp"]

EXPOSE 9000
