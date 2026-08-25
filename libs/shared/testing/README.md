# shared-testing

This library was generated with [Nx](https://nx.dev).

It publishes the canonical API contract's node-side test harness: MSW request
handlers for `/config.json` and `GET /me`, a node MSW server for unit/component
tests, and a contract validator that checks values against
`docs/api/openapi.yaml` so mocks cannot silently drift from the contract.

## Running unit tests

Run `nx test shared-testing` to execute the unit tests via [Vitest](https://vitest.dev/).
