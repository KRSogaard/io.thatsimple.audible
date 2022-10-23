#!/usr/bin/env bash

if [[ "$1" == '' ]] ; then
  echo "Missing version argument"
  exit
fi


echo "Building docker image for version $1"
docker build -t krsogaard/audible-series:"$1" .
echo "Pushing version $1 to docker hub"
docker push krsogaard/audible-series:"$1"
echo "Tagging version $1 as latest"
docker tag krsogaard/audible-series:"$1" krsogaard/audible-series:latest
echo "Pushing version latest to docker hub"
docker push krsogaard/audible-series:latest