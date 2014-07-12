#!/usr/bin/env bash

COMMONPLACE=./node_modules/commonplace/bin/commonplace

find . -name 'src/*.deflate' -delete
find . -name 'src/*.gz' -delete

npm install
npm install --force commonplace@0.4.21

$COMMONPLACE includes
$COMMONPLACE langpacks
