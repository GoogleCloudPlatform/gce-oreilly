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
VOLUMES="-v $PWD/$STEP:/src -v $PWD/wsk:/wsk"

for i in $(seq $START $END)
do
  if [ $i = "0" ]
  then
    sudo docker run -p 80:80 -p 8080:8080 -p 3000:3000 -p 3001:3001 $VOLUMES -h perfuse-master -d marcacohen/perfuse
  else
    sudo docker run $VOLUMES -h perfuse-$i -d marcacohen/perfuse
  fi
done
