    # Set project, zone, and request specific constants.
    API_VERSION = "v1"
    PROJECT_ID = "your-project-id"
    ZONE = "us-central1-a"
    MACHINE_TYPE = "n1-standard-1"
    IMAGE_PROJECT = "debian-cloud"
    IMAGE = "debian-7-wheezy-v20131120"
    URL_PREFIX = "https://www.googleapis.com/compute/"
    BODY = {
  "name": "test-vm",
  "machineType": (URL_PREFIX + "%s/project/%s/zones/%s/machineTypes/%s" %
                  API_VERSION, PROJECT, ZONE, MACHINE_TYPE),
  "disks": [
    {
      "boot": true,
      "type": "PERSISTENT",
      "mode": "READ_WRITE",
            "zone": 
               (URL_PREFIX + "%s/projects/%s/zones/%s" %
                                (API_VERSION, PROJECT, ZONE)),
        "initializeParams": {
        "sourceImage": (URL_PREFIX + "%s/projects/%s/global/images/%s" %
                                                (API_VERSION, IMAGE_PROJECT, IMAGE)) 
      },
    }
  ],
  "networkInterfaces": [
    {
      "accessConfigs": [
        {
          "name": "External NAT",
          "type": "ONE_TO_ONE_NAT"
        }
      ],
      "network": (URL_PREFIX + "%s/projects/%s/global/networks/default" % 
                  (API_VERSION, PROJECT_ID))
    }
  ],
  "scheduling": {
    "automaticRestart": "true",
    "onHostMaintenance": "MIGRATE"
  },
  "serviceAccounts": [
    {
      "email": "default",
      "scopes": [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/compute",
        "https://www.googleapis.com/auth/devstorage.full_control"
      ]
    }
  ],
  "metadata": {
    "items": []
  },
}

    # Build and execute instance insert request.
    request = service.instances().insert(project=PROJECT_ID, 
                zone=ZONE, body=BODY)
    try:
      response = request.execute(http)
    except Exception, ex:
      print "ERROR: " + str(ex)
      sys.exit()

    # Instance creation is asynchronous so now wait for response.
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
        print "Instance created."
	break
