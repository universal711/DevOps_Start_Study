# Visit Counter - DevOps Study Project

A simple visit counter web application with Docker and Kubernetes deployment, automated with GitHub Actions CI/CD.

## 🚀 Quick Start

```bash
# Setup project
./scripts/setup.sh

# Test locally
./scripts/test-local.sh

# Build Docker image
docker build -t visit-counter:1.0 .

# Run locally
docker run -p 3000:3000 visit-counter:1.0
