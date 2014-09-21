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

USAGE="run.sh step beg end"

if [ $# != 3 ]
then
  # Make sure user supplied three args: step, start, and end.
  echo $USAGE
  exit 1
fi

STEP=$1
START=$2
END=$3
VOLUMES_MASTER="-v $PWD/$STEP:/src -v $PWD/wsk:/wsk"
VOLUMES_SLAVES="-v $PWD/$STEP:/src"
PORTS_MASTER="-p 80:80 -p 8080:8080 -p 3000:3000 -p 3001:3001"
PORTS_SLAVES=""
IMAGE="perfuse/test"

for i in $(seq $START $END)
do
  if [ $i = "0" ]
  then
    VOLUMES=$VOLUMES_MASTER
    PORTS=$PORTS_MASTER
    HOSTNAME=perfuse-master
  else
    VOLUMES=$VOLUMES_SLAVES
    PORTS=$PORTS_SLAVES
    HOSTNAME="perfuse-$i"
  fi
  sudo docker run $VOLUMES $PORTS -h $HOSTNAME -d $IMAGE
done
