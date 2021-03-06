# -*- coding: utf-8 -*-
#
# Copyright (C) 2014 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

'''Set project-level metadata.
Usage:
  $ python ch7-4.py

You can also get help on all the command-line flags the program understands
by running:

  $ python ch7-4.py --help

'''

import argparse
import httplib2
import os
import sys

from apiclient import discovery
from oauth2client import file
from oauth2client import client
from oauth2client import tools

# Parser for command-line arguments.
parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter,
    parents=[tools.argparser])

# CLIENT_SECRET is the name of a file containing the OAuth 2.0 information
# for this application, including client_id and client_secret.
CLIENT_SECRET = os.path.join(os.path.dirname(__file__), 'client_secret.json')

# Set up a Flow object to be used for authentication. PLEASE ONLY
# ADD THE SCOPES YOU NEED. For more information on using scopes please
# see <https://developers.google.com/compute/docs/api/how-tos/authorization>.
FLOW = client.flow_from_clientsecrets(
    CLIENT_SECRET,
    scope=['https://www.googleapis.com/auth/compute'],
    message=tools.message_if_missing(CLIENT_SECRET))

def main(argv):
  # Parse the command-line flags.
  flags = parser.parse_args(argv[1:])

  # If the credentials don't exist or are invalid run through the native client
  # flow. The Storage object will ensure that if successful the good
  # credentials will get written back to the file.
  storage = file.Storage('sample.dat')
  credentials = storage.get()
  if credentials is None or credentials.invalid:
    credentials = tools.run_flow(FLOW, storage, flags)

  # Create an httplib2.Http object to handle our HTTP requests and authorize it
  # with our good Credentials.
  http = httplib2.Http()
  http = credentials.authorize(http)

  # Construct the service object for the interacting with the Compute Engine API.
  service = discovery.build('compute', 'v1', http=http)

  # print 'Success! Now add code here.'

  PROJECT_ID = 'your-project-id'
  METADATA = {
    'key': 'cloud-storage-bucket',
    'value': 'bucket'
  }

  # First retrieve the current metadata.
  request = service.projects().get(project=PROJECT_ID)
  try:
    response = request.execute()
  except Exception, ex:
    print 'ERROR: ' + str(ex)
    sys.exit()

  # Use the commonInstanceMetadata dictionary as the body
  # of the request, and add or update the cloud-storage-bucket
  # metadata entry in the list of items in the dictionary.
  BODY = response['commonInstanceMetadata']
  for item in BODY['items']:
    if item['key'] == METADATA['key']:
      item['value'] = METADATA['value']
      break
  else:
    BODY['items'].append(METADATA)

  # Build and execute the set common instance metadata request.
  request = service.projects().setCommonInstanceMetadata(
      project=PROJECT_ID, body=BODY)
  try:
    response = request.execute()
  except Exception, ex:
    print 'ERROR: ' + str(ex)
    sys.exit()

  # Setting metadata is asynchronous so wait for an operation status of DONE.
  op_name = response['name']
  operations = service.globalOperations()
  while True:
    request = operations.get(project=PROJECT_ID, operation=op_name)
    try:
      response = request.execute()
    except Exception, ex:
      print 'ERROR: ' + str(ex)
      sys.exit()
    if 'error' in response:
      print 'ERROR: ' + str(response['error'])
      sys.exit()
    status = response['status']
    if status == 'DONE':
      print 'Project-level metadata updated.'
      break
    else:
      print 'Waiting for operation to complete. Status: ' + status


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
