# Run the Demo (Quick)

This explains the minimal steps to run the demo locally or in Codespaces.

1. Start services

```bash
# from repo root
./run-demo.sh
```

2. Open the frontend

- Local: http://localhost:3000/
- Codespaces: open the Ports view and make port 3000 public, then use the Codespaces forwarding URL.

3. API endpoints

- Metrics: http://localhost:8080/api/v1/metrics
- Logs: http://localhost:8080/api/v1/logs?limit=5

Notes
- I removed generated `build/` artifacts from Git and added a top-level `.gitignore` to prevent them from reappearing in commits.
- Keep the Codespace running while reviewers access the public URL.
