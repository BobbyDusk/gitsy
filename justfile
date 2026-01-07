# build to zip
build:
    mkdir -p build && \
    zip -r build/gitsy.zip manifest.json images scripts styles app.js app.html COPYING README.md