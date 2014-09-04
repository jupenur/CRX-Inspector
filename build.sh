#!/usr/bin/env bash

rm 'CRX Inspector.zip';
zip -r 'CRX Inspector.zip' . -x build.sh .git/\* .gitignore;
