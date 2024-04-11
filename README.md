![release](https://github.com/Thamsta/rust-petrinet-simulator/actions/workflows/rust.yml/badge.svg?branch=main)

# RustNet Simulator
A modern and lightweight open source Petri net editor. Open, edit, simulate P/T-nets, generate and visualize their state
spaces.
Running on Rust and an Angular frontend.

## Requirements

Required: 
* [Rust](https://www.rust-lang.org/tools/install) (tested with 1.73.0)
* [npm](https://www.npmjs.com/package/npm) (tested with npm 10.2.3 and node 20.9.0). 
* Tauri-CLI: Install via Cargo using `cargo install tauri-cli`. See also [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) when having trouble related to Tauri.

Suggested: 
* [Angular CLI](https://angular.io/cli)

## Development server

Run `cargo tauri dev` to run a dev version. This will automatically start the rust backend and angular frontend in development.
The application will automatically reload if you change any of the source files.

## Build

See `https://tauri.app/v1/guides/building/`
