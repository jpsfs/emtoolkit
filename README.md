# Engineering Manager Toolkit

Engineering Manager toolkit aims to be a swiss army knife for Engineering Managers.
The goal is to collect and correlate metrics in an easy and extendable way.

Currently the tool is in it's infancy and provides only a small sub-set of features available.

## How to run?

### CLI

To run the CLI:

```sh
curl -O https://raw.githubusercontent.com/jpsfs/emtoolkit/main/scripts/emtoolkit-cli.sh
curl -O https://raw.githubusercontent.com/jpsfs/emtoolkit/main/scripts/.env.emtoolkit-cli
```

To see commands available check the CLI `--help`.


## Features

### Integrations

* BambooHR
* Linear

## How to build?

### CLI
The CLI is in the backend folder. In order to build it:

```sh
cd /src/backend/
npm install && npm run build
```

#### To build the docker container

```sh
cd /src/backend/
docker build --target cli -t emtoolkit-cli .
```