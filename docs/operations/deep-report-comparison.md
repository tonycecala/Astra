# Deep Report Comparison

Use this operator routine to create a new production Sonnet 5 Deep Report for Tony and compare it with his most recent completed Deep Report.

```bash
npm run report:compare-deep -- --email astramaster@tony.io --generate
```

The explicit `--generate` flag acknowledges that the command makes a billable model call. The routine:

1. Reads the most recent completed Tony Deep Report without changing it.
2. Reuses that report's exact saved Self chart and chart settings.
3. Creates the new request through Astra's normal authenticated purchase flow.
4. Uses the admin replay path with the production model profile.
5. Fails unless stored provenance confirms `anthropic/claude-sonnet-5`.
6. Reads both stored results and writes a plain-language comparison to `.astra-exports/comparisons/`.

The comparison is private, mode `0600`, and ignored by Git. The routine reports estimated writer spend and generation time from stored metadata. Admin orders record the normal Deep Report cost without deducting Stars.
