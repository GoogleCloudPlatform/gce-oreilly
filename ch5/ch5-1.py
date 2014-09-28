# -*- coding: utf-8 -*-
#
# Copyright (C) 2014 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Retrieve project information using the Compute Engine API.
Usage:
  $ python ch5-1.py

You can also get help on all the command-line flags the program understands
by running:

  $ python ch5-1.py --help

"""

import argparse
import httplib2
import os
import sys

from apiclient import discovery
from oauth2client import file
from oauth2client import client
from oauth2client import tools
from oauth2client.gce import AppAssertionCredentials

# Set project, zone, and other constants.
API_NAME = 'datastore'
API_VERSION = 'v1beta1'
PROJECT_ID = 'gce-oreilly'

# Parser for command-line arguments.
parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter,
    parents=[tools.argparser])

def commit(datastore, peak, year, title):
  body = {
    'mode': 'NON_TRANSACTIONAL',
    'mutation': {
      'insertAutoId': [
        {
          'key': {
            'partitionId': { 'namespace': 'Beatles' },
            'path': [ { 'kind': 'song' } ]
          },
          'properties': { 
            'peak': { 'integerValue': peak },
            'year': { 'integerValue': year },
            'title': { 'stringValue': title }
          }
        }
      ]
    }
  }
  try:
    req = datastore.commit(datasetId=PROJECT_ID, body=body)
    resp = req.execute()
  except Exception, ex:
    print 'ERROR: ' + str(ex)
    sys.exit()

def main(argv):
  # Parse the command-line flags.
  flags = parser.parse_args(argv[1:])

  # Obtain service account credentials from virtual machine environement.
  credentials = AppAssertionCredentials(['https://www.googleapis.com/auth/datastore'])

  # Create an httplib2.Http object to handle our HTTP requests and authorize it
  # with our good Credentials.
  http = httplib2.Http()
  http = credentials.authorize(http)

  # Construct the service object for the interacting with the Compute Engine API.
  service = discovery.build(API_NAME, API_VERSION, http=http)

  commit(service.datasets(), 1960, 10, 'foo')

# For more information on the Compute Engine API you can visit:
#
#   https://developers.google.com/compute/docs/reference/latest/
#
# For more information on the Compute Engine API Python library surface you
# can visit:
#
#   https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/
#
# For information on the Python Client Library visit:
#
#   https://developers.google.com/api-client-library/python/start/get_started
if __name__ == '__main__':
  main(sys.argv)
