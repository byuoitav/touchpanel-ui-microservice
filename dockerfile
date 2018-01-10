FROM amd64/alpine
MAINTAINER Daniel Randall <danny_randall@byu.edu>

ARG NAME

COPY ${NAME}-bin ${NAME}-bin 

ENTRYPOINT ./${NAME}-bin
EXPOSE 8888
