# Bank CSV Normalizer — v1.0 candidate

North Vault Digital's Bank CSV Normalizer is a browser-only utility for
preflighting inconsistent CSV exports. It detects common date, description,
amount/debit/credit fields; normalizes dates and signed amounts; flags missing
values, malformed row widths, and possible duplicates; and downloads a
normalized CSV plus an exception report.

## Privacy and scope

- Processing is local in the browser.
- No file upload, bank connection, account lookup, analytics script, or API is
  included.
- Input is limited to 10 MB and 100,000 data rows.
- Do not use credentials, bank login data, or files you are not authorized to
  inspect.
- This does not reconcile accounts or provide accounting, tax, legal, or
  financial advice.

## Use

Open `index.html` in a modern browser, choose a CSV, review the detected
columns, analyze locally, and download the output or exception report.

## Development

The pure logic is in `app_core.js`. Run the candidate tests from the package
root with:

```text
node tests/test_core.js
```

This candidate has no runtime dependencies and makes no network requests.

## Monetization path

The free utility is intentionally useful on its own. Optional next steps are
custom cleanup, workflow automation/integration, or a paid packaged workflow.
The public CTA is a separate destination and does not receive uploaded CSV
data.
