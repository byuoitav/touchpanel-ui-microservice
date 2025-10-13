FROM gcr.io/distroless/static

ARG NAME

COPY ${NAME} /app

# add any required files/folders here
# COPY blueberry-dist blueberry-dist
COPY redirect.html redirect.html

ENTRYPOINT ["/app"]