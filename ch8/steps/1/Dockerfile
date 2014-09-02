# DOCKER-VERSION 0.3.4

# We use centos as our base distro for this app. This shows that
# our container can be built with a different Linux distribution 
# (centos) than the one hosting the container (debian).
FROM centos:6.4

# Install EPEL (Extra Packages for Enterprise Linix) for Node.js
RUN rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
# Install git.
RUN yum install -y git
# Install Node.js and npm.
RUN yum install -y npm
# Install ZeroMQ.
RUN yum install -y zeromq zeromq-devel

# Set /src as the working directory for this container.
WORKDIR /src

# Open up external access to port 80.
EXPOSE  80

# Run startup command.
CMD ["node", "/scripts/server.js"]
