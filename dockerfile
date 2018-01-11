FROM amd64/alpine
MAINTAINER Daniel Randall <danny_randall@byu.edu>

ARG NAME
ENV name=${NAME}

COPY ${name}-bin ${name}-bin 

# add any required files/folders
COPY blueberry-dist blueberry-dist

ENTRYPOINT ./${name}-bin
EXPOSE 8888
