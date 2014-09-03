
# We use debian as our base distro for this container.
FROM debian:latest

# Refresh apt-get.
RUN apt-get update

# Install some utilities needed by node, npm, and ZeroMQ.
RUN apt-get install -y curl make g++
RUN curl -sL https://deb.nodesource.com/setup | bash -

# Install Node.js and npm.
RUN apt-get install -y npm

# Install ZeroMQ.
RUN apt-get install -y libzmq-dev

# Set /src as the working directory for this container.
WORKDIR /src

# Install required npm packages globally.
ADD package.json /src/package.json
RUN npm install -g

# Open up external access to port 80.
EXPOSE  80

# Run startup command.
CMD ["node", "/src/scripts/server.js"]
