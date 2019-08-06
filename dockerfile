FROM byuoitav/amd64-alpine
LABEL Daniel Randall <danny_randall@byu.edu>

ARG NAME
ENV name=${NAME}

COPY ${name}-bin ${name}-bin 
COPY version.txt version.txt

# add any required files/folders here
COPY blueberry-dist blueberry-dist
COPY cherry-dist cherry-dist
COPY redirect.html redirect.html

ENTRYPOINT ./${name}-bin
