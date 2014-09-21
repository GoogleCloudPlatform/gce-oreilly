#! /bin/bash

# Copyright 2014 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

USAGE="cluster.sh start|stop beg end"
ZONE="--zone us-central1-a"
TYPE="--machine-type f1-micro"
MTCE="--maintenance-policy TERMINATE"
META_INIT="--metadata-from-file google-container-manifest="
IMAGE="--image container-vm-v20140826 --image-project google-containers"
QUIET="-q"
PREFIX="perfuse-"

if [ $# != 3 ]
then
  # Make sure user supplied three args: operation, start, and end.
  echo $USAGE
  exit 1
fi

OP=$1
START=$2
END=$3

for i in $(seq $START $END)
do
  if [ $i = "0" ]
  then
    ID=${PREFIX}master
    META="${META_INIT}master.yaml"
  else
    ID=${PREFIX}$i
    cp slave.yaml $ID.yaml
    echo "        value: $ID" >>$ID.yaml
    META="${META_INIT}$ID.yaml"
  fi

  if [ "$OP" = "start" ]
  then
    gcloud compute instances create $ID $META $ZONE $TYPE $MTCE \
      $IMAGE $QUIET &
  elif [ "$OP" = "stop" ]
  then
    gcloud compute instances delete $ID $ZONE $QUIET &
  else
    echo $USAGE
    exit 1
  fi
done

# All requests above were run in the background, the following wait command causes 
# us to wait until all requests have completed before exiting this script.
wait

# Clean up per-slave manifest files.
for i in $(seq $START $END)
do
  if [ $i != "0" ]
  then
    rm -f ${PREFIX}$i
  fi
done
