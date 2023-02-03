FROM gcr.io/distroless/static

ARG NAME

COPY ${NAME} /app
COPY version.txt version.txt

# add any required files/folders here
COPY blueberry-dist blueberry-dist
COPY cherry-dist cherry-dist
COPY redirect.html redirect.html

ENTRYPOINT ["/app"]
