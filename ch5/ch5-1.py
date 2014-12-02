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
API_VERSION = 'v1beta2'
PROJECT_ID = 'your-project-id'
DATA = (
  ('My Bonnie', 1961, 26),
  ('Love Me Do', 1962, 1),
  ('From Me to You', 1963, 116),
  ('She Loves You', 1963, 1),
  ('Roll Over Beethoven', 1963, 68),
  ('I Want to Hold Your Hand', 1963, 1),
  ('Please Please Me', 1964, 3),
  ('All My Loving', 1964, 45),
  ('Why', 1964, 88),
  ('Twist and Shout', 1964, 2),
  ('Can\'t Buy Me Love', 1964, 1),
  ('Do You Want to Know a Secret', 1964, 2),
  ('Ain\'t She Sweet', 1964, 19),
  ('A Hard Day\'s Night', 1964, 1),
  ('I\'ll Cry Instead', 1964, 25),
  ('And I Love Her', 1964, 12),
  ('Matchbox', 1964, 17),
  ('I Feel Fine', 1964, 1),
  ('Eight Days a Week', 1965, 1),
  ('Ticket to Ride', 1965, 1),
  ('Help', 1965, 1),
  ('Yesterday', 1965, 1),
  ('Boys', 1965, 102),
  ('We Can Work It Out', 1965, 1),
  ('Nowhere Man', 1966, 3),
  ('Paperback Writer', 1966, 1),
  ('Yellow Submarine', 1966, 2),
  ('Penny Lane', 1967, 1),
  ('All You Need Is Love', 1967, 1),
  ('Hello Goodbye', 1967, 1),
  ('Lady Madonna', 1968, 4),
  ('Hey Jude', 1968, 1),
  ('Get Back', 1969, 1),
  ('The Ballad of John and Yoko', 1969, 8),
  ('Something', 1969, 3),
  ('Let It Be', 1970, 1),
  ('The Long and Winding Road', 1970, 1),
  ('Got to Get You into My Life', 1976, 7),
  ('Ob-La-Di, Ob-La-Da', 1976, 49),
  ('Sgt. Pepper\'s Lonely Hearts Club Band', 1978, 71),
  ('The Beatles Movie Medley', 1982, 12),
  ('Baby It\'s You', 1995, 67),
  ('Free as a Bird', 1995, 6),
  ('Real Love', 1996, 11)
)

# Parser for command-line arguments.
parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter,
    parents=[tools.argparser])

def commit(datastore, title, year, peak):
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

  # Obtain service account credentials from virtual machine environment.
  credentials = AppAssertionCredentials(['https://www.googleapis.com/auth/datastore'])

  # Create an httplib2.Http object to handle our HTTP requests and authorize
  # it with our good Credentials.
  http = httplib2.Http()
  http = credentials.authorize(http)

  # Construct the service object for the interacting with the Compute Engine
  # API.
  service = discovery.build(API_NAME, API_VERSION, http=http)

  for (title, year, peak) in DATA:
    commit(service.datasets(), title, year, peak)

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
