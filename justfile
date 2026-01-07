# build to zip
build:
    mkdir -p build && \
    rm -f build/gitsy.zip && \
    zip -r build/gitsy.zip manifest.json images scripts styles app.js app.html COPYING README.md