#!/bin/bash

script_dir="$(dirname $0)"

pushd "$script_dir/.." > /dev/null
typedoc --name Configuration --out docs --sort static-first  ./src/config/loader.ts 
popd > /dev/null
