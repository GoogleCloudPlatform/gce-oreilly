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
  $ python ch3-1.py

You can also get help on all the command-line flags the program understands
by running:

  $ python ch3-1.py --help

"""

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
# ADD THE SCOPES YOU NEED. For more information on using scopes
# see <https://developers.google.com/compute/docs/api/how-tos/authorization>.
FLOW = client.flow_from_clientsecrets(
    CLIENT_SECRET,
    scope=['https://www.googleapis.com/auth/compute'],
    message=tools.message_if_missing(CLIENT_SECRET))

# JSON doc capturing details of persistent disk creation request. 
BODY1 = {
  "name": "new-disk",
  "zone": "https://www.googleapis.com/compute/v1/projects/gce-oreilly/zones/us-central1-a",
  "type": "https://www.googleapis.com/compute/v1/projects/gce-oreilly/zones/us-central1-a/diskTypes/pd-standard",
  "sizeGb": "10"
}

# JSON doc capturing details of instance creation request, 
# referencing newly created persistent disk as boot device.
BODY2 = {
  "disks": [
    {
      "type": "PERSISTENT",
      "boot": True,
      "mode": "READ_WRITE",
      "deviceName": "new-disk",
      "zone": "https://www.googleapis.com/compute/v1/projects/gce-oreilly/zones/us-central1-a",
      "source": "https://www.googleapis.com/compute/v1/projects/gce-oreilly/zones/us-central1-a/disks/new-disk",
      "autoDelete": True
    }
  ],
  "networkInterfaces": [
    {
      "network": "https://www.googleapis.com/compute/v1/projects/gce-oreilly/global/networks/default",
      "accessConfigs": [
        {
          "name": "External NAT",
          "type": "ONE_TO_ONE_NAT"
        }
      ]
    }
  ],
  "metadata": {
    "items": []
  },
  "tags": {
    "items": []
  },
  "zone": "https://www.googleapis.com/compute/v1/projects/gce-oreilly/zones/us-central1-a",
  "canIpForward": False,
  "scheduling": {
    "automaticRestart": True,
    "onHostMaintenance": "MIGRATE"
  },
  "machineType": "https://www.googleapis.com/compute/v1/projects/gce-oreilly/zones/us-central1-a/machineTypes/n1-standard-1",
  "name": "new-instance",
  "serviceAccounts": [
    {
      "email": "default",
      "scopes": [
        "https://www.googleapis.com/auth/devstorage.read_only"
      ]
    }
  ]
}

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

  # Set project, zone, and other constants.
  URL_PREFIX = 'https://www.googleapis.com/compute'
  API_VERSION = 'v1'
  PROJECT_ID = 'your-project-id'
  PROJECT_URL = '%s/%s/projects/%s' % (URL_PREFIX, API_VERSION, PROJECT_ID)
  INSTANCE_NAME = 'test-vm'
  ZONE = 'us-central1-a'
  MACHINE_TYPE = 'n1-standard-1'
  IMAGE_PROJECT_ID = 'debian-cloud'
  IMAGE_PROJECT_URL = '%s/%s/projects/%s' % (
      URL_PREFIX, API_VERSION, IMAGE_PROJECT_ID)
  IMAGE_NAME = 'debian-7-wheezy-v20140807'

  def wait_for_result(obj_type, response):
    # Wait for response to asynch operation.
    print 'Waiting for', obj_type, 'creation.'
    op_name = response["name"]
    operations = service.zoneOperations()
    while True:
      request = operations.get(project=PROJECT_ID, zone=ZONE, 
                  operation=op_name)
      try:
        response = request.execute()
      except Exception, ex:
        print "ERROR: " + str(ex)
        sys.exit()
      if "error" in response:
        print "ERROR: " + str(response["error"])
        sys.exit()
      status = response["status"]
      if status == "DONE":
        print obj_type + " created."
        break

  requests = (('Disk', service.disks, BODY1), ('Instance', service.instances, BODY2)) 
  # Build and execute two requests in sequence.
  for (type, method, body) in requests:
    request = method().insert(project=PROJECT_ID, zone=ZONE, body=body)
    try:
      response = request.execute(http)
    except Exception, ex:
      print "ERROR: " + str(ex)
      sys.exit()
    wait_for_result(type, response)

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
