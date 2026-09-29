# Security and privacy notes

## Data boundary

The application uses `FileReader`, in-memory JavaScript state, and browser
downloads. It has no fetch/XHR/WebSocket call, no cookies, no local storage,
and no credential or bank integration.

## Threat assumptions

The browser and local machine remain trusted. A malicious or compromised
browser extension, downloaded output, or local machine is outside this
utility's protection boundary.

## Safe use

Use a copy of the input, remove unnecessary personal data, and inspect the
exception report before using any output. Do not interpret normalized output as
financial truth without independent review.

## Disclosure status

This file documents the candidate's intended boundary. Public publication
still requires Owner review of source provenance, license choice, destination
account, and final artifact hashes.
