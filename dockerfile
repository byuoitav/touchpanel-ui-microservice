FROM gcr.io/distroless/static

ARG NAME
ENV name=${NAME}

COPY ${name} ${name}
COPY version.txt version.txt

# add any required files/folders here
COPY blueberry-dist blueberry-dist
COPY cherry-dist cherry-dist
COPY redirect.html redirect.html

ENTRYPOINT ./${name}
