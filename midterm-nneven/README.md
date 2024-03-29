[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-f059dc9a6f8d3a56e377f745f24479a46679e63a5d9fe6f495e02850cd0d8118.svg)](https://classroom.github.com/online_ide?assignment_repo_id=7163688&assignment_repo_type=AssignmentRepo)
# Solidity Project Template

Providing a project with a template for the files, folder structure, dependencies, scripting, configuration (local & remote) and development standards used in a Windranger Soldity project with TypeScript tests.

---

## Development Process

Development follows these processes outlined in [development process](docs/development_process.md)

---

## Project Installation, building and running

Git clone, then from the project root execute

#### Install

To retrieve the project dependencies and before any further tasks will run correctly

```shell
npm ci
```

#### Husky Git Commit Hooks

To enable Husky commit hooks to trigger the lint-staged behaviour of formatting and linting the staged files prior
before committing, prepare your repo with `prepare`.

```shell
npm run prepare
```

#### Build and Test

```shell
npm run build
npm test
```

If you make changes that don't get picked up then add a clean into the process

```shell
npm run clean
npm run build
npm test
```

### Hardhat

If you want to avoid using the convience scripts, then you can execute against Hardhat directly.

#### All tests

Target to run all the mocha tests found in the `/test` directory, transpiled as necessary.

```shell
npx hardhat test
```

#### Single test

Run a single test (or a regex of tests), then pass in as an argument.

```shell
 npx hardhat test .\test\sample.test.ts
```

#### Scripts

The TypeScript transpiler will automatically as needed, execute through HardHat for the instantiated environment

```shell
npx hardhat run .\scripts\sample-script.ts
```

### Logging

Logging is performed with Bunyan

#### Bunyan CLI

To have the JSON logging output into a more human-readable form, pipe the stdout to the Bunyan CLI tool.

```shell
npx hardhat accounts | npx bunyan
```

## Sequence Diagram Rendering

To create or update the renders for the Plant UML sequence diagrams

#### Ensure Java is installed

```shell
java -version
```

The output will vary depending on OS, however if it fails claiming Java is not found, then you must install before proceeding.

#### Generate renders for all Plant UML documents under `docs/spec`

```shell
npm run plant
```

## Solidity Static Analysis (Slither)

We use the Trail of Bits Solidity static analyzer [Slither](https://github.com/crytic/slither).

### Local

#### Install

With Python 3 in your environment, install using the Python package manager `pip3`:

```shell
pip3 install slither-analyzer
```

#### Run

When at the project root, to run and exclude the `node_modules` path:

```shell
slither . --filter-paths "node_modules"
```

Alternatively to run using a `slither.json` config file:

```shell
slither . --config-file slither.json
```

### Docker

The Trail of Bits toolbox image contains a number of applications (including Slither).

#### Install

With Docker in your environment, install the image from DockerHub:

```shell
docker pull trailofbits/eth-security-toolbox
```

#### Run

To start a new container with your local source mounted/accessible within the container:
(replacing <ABSOLUTE_PATH_TO_WORKING_DIRECTORY> with the absolute path to the project working directory)

```shell
docker run -it --mount type=bind,source=<ABSOLUTE_PATH_TO_WORKING_DIRECTORY>,destination=/home/ethsec/test-me trailofbits/eth-security-toolbox
```

The container will automatically start and log you in, with the project code located in `test-me`.
Navigate into the `test-me` directory and run the static analysis:

```shell
cd test-me
slither . --filter-paths "node_modules"
```

Alternatively to run using a `slither.json` config file:

```shell
cd test-me
slither . --config-file slither.json
```
