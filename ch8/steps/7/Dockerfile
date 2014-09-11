
# We use debian as our base distro for this container.
FROM debian:latest

# Refresh apt-get.
RUN apt-get update

# Install some utilities needed by node, npm, and ZeroMQ.
RUN apt-get install -y curl make g++

# Install Node.js and npm.
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get install -y npm

# Install ZeroMQ libs.
RUN apt-get install -y libzmq-dev

# Install fio disk perf test tool.
RUN apt-get install -y fio
RUN mkdir /tmp/fio-test

# Install required npm packages.
ADD package.json /package.json
RUN npm install

# Add current step 7 contents and wsk contents into container.
ADD 7 /src
ADD 7/bower_components /src/bower_components
ADD wsk /wsk

# Set /src as the working directory for this container.
WORKDIR /src

# Open up external access to port 80.
EXPOSE  80

# Run startup command.
CMD ["node", "/src/scripts/server.js"]
