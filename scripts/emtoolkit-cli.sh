#!/bin/sh

BASEDIR=$(dirname $0)

echo "
  ______ __  __   _______          _    _ _      _____ _      _____ 
 |  ____|  \/  | |__   __|        | |  (_) |    / ____| |    |_   _|
 | |__  | \  / |    | | ___   ___ | | ___| |_  | |    | |      | |  
 |  __| | |\/| |    | |/ _ \ / _ \| |/ / | __| | |    | |      | |  
 | |____| |  | |    | | (_) | (_) |   <| | |_  | |____| |____ _| |_ 
 |______|_|  |_|    |_|\___/ \___/|_|\_\_|\__|  \_____|______|_____|

"

# Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  >&2 echo "You need Docker installed to run EM Toolkit using this script. Install it and retry."
  exit -1
fi

if ! [ -f "$BASEDIR/.env.emtoolkit-cli" ]; then
  >&2 echo ".env.toolkit-cli file doesn't exist. Make sure it exists and has the needed env variables to run the CLI"
fi

# Load Environment Variables stored in the .env.emtoolkit-cli files
# Run pass the arguments to the docker container
docker run --interactive --tty --rm --env-file "$BASEDIR/.env.emtoolkit-cli" emtoolkit-cli index.js "$@"