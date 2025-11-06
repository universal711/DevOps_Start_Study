# DevOps_Start_Study

First work with Docker and Kubernetes

Before running this, install Docker and Kubernetes.

1) Create project - easy web-app "Visit counter"

2) Create project structure:
   
   ```bash
   #! /bin/bash
   mkdir express-kubernetes-vc && cd express-kubernetes-vc
   mkdir app kubernetes scripts
   cd app
   
   ```

   Create package.json:
   
   ```bash
   #! /bin/bash

   cat > package.json << 'EOF'
     {
         "name": "visit-counter",
         "version": "1.0.0",
         "description": "Visit counter app for Docker/K8s demo",
         "main": "server.js",
         "scripts": {
            "start": "node server.js",
            "dev": "nodemon server.js",
            "test": "echo \"Error: no test specified\" && exit 1"
         },
         "dependencies": {
            "express": "^4.18.2"
         },
         "engines": {
            "node": ">=18.0.0"
         }
      }

   EOF
   
   ```


Create server.js:
```bash
#! /bin/bash
            
cat > server.js << 'EOF'

cat > server.js << 'EOF'

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

let visitCount = 0;

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.get('/', (req, res) => {
  visitCount++;
  res.json({
    message: 'Hello from Docker & Kubernetes!',
    visitCount: visitCount,
    timestamp: new Date().toISOString(),
    containerId: process.env.HOSTNAME || 'local',
    nodeVersion: process.version
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'visit-counter',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/stats', (req, res) => {
  res.json({
    totalVisits: visitCount,
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    visitCount: visitCount,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /stats',
      'GET /metrics'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Main endpoint: http://localhost:${PORT}/`);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

EOF
```

4) Local test for app:

In the First terminal:

```bash
!# /bin/bash


cd ~/express-kubernetes-vc/app

npm install

cd ~/express-kubernetes-vc/app

node server.js

```
   
In the second terminal:

```bash
!# /bin/bash

curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/stats
```



5) Create dockerfile and .dockerignore file:

```bash
#! /bin/bash

cat > Dockerfile << 'EOF'

FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
   
WORKDIR /app
 
COPY app/package.json ./
 
RUN npm install --production --silent && npm cache clean --force
 
COPY app/server.js ./

RUN chown -R nextjs:nodejs /app
USER nextjs
 
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => \
{ process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
 
CMD ["node", "server.js"]

EOF
```

```bash
#! /bin/bash

cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.DS_Store
Dockerfile
.dockerignore
kubernetes/
scripts/

EOF
```
   
6)Build and start in DOCKER:

```bash
#! /bin/bash

cd ~/express-kubernetes-vc

docker build -t visit-counter:1.0 .
    
docker images | grep visit-counter
    
docker run -d --name my-app -p 3000:3000 visit-counter:1.0
    
docker ps
    
sleep 3
    
curl http://localhost:3000/
    
curl http://localhost:3000/health
```


Result:

   ```
    { 
     "message": "Hello from Docker & Kubernetes!", 
     "visitCount": 1,
     "timestamp": "2024-01-15T10:00:00.00Z",
     "containerID": "abc123"
    }
   ```

7)Stop container:

```bash
#! /bin/bash
            
docker stop my-app
docker rm my-app
```

8)Work with Kubernetes(minikube):

```bash
#! /bin/bash
            
minikube start
minikube status
kubectl get nodes
```
    
9) Create Kubernetes manifests:

Namespace manifest:

```bash

#!/bin/bash
cat > kubernetes/namespace.yaml << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: visit-counter
  labels:
    name: visit-counter
EOF

```

ConfigMap manifest:

```bash
#!/bin/bash
cat > kubernetes/configmap.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: visit-counter-config
  namespace: visit-counter
  labels:
    app: visit-counter
data:
  PORT: "3000"
  NODE_ENV: "production"
  LOG_LEVEL: "info"
EOF

```

Secret manifest:

```bash

#!/bin/bash
cat > kubernetes/secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: visit-counter-secret
  namespace: visit-counter
  labels:
    app: visit-counter
type: Opaque
data:
  # echo -n 'my-super-secret-api-key' | base64
  api-key: bXktc3VwZXItc2VjcmV0LWFwaS1rZXk=
EOF

```

Service Account manifest:

```bash

#!/bin/bash
cat > kubernetes/service-account.yaml << 'EOF'
apiVersion: v1
kind: ServiceAccount
metadata:
  name: visit-counter-sa
  namespace: visit-counter
  labels:
    app: visit-counter
automountServiceAccountToken: false
EOF

```

Deployment manifest:

```bash

#!/bin/bash
cat > kubernetes/deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: visit-counter
  namespace: visit-counter
  labels:
    app: visit-counter
    version: "1.0"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: visit-counter
  template:
    metadata:
      labels:
        app: visit-counter
        version: "1.0"
    spec:
      containers:
      - name: visit-counter
        image: visit-counter:1.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
          protocol: TCP
        env:
        - name: PORT
          value: "3000"
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
EOF

```

Service manifest:

```bash

#!/bin/bash
cat > kubernetes/service.yaml << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: visit-counter-service
  namespace: visit-counter
  labels:
    app: visit-counter
spec:
  selector:
    app: visit-counter
  ports:
  - name: http
    protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
EOF

```

Network Policy:

```bash

#!/bin/bash
cat > kubernetes/network-policy.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: visit-counter-network-policy
  namespace: visit-counter
  labels:
    app: visit-counter
spec:
  podSelector:
    matchLabels:
      app: visit-counter
  policyTypes:
  - Ingress
  ingress:
  - ports:
    - protocol: TCP
      port: 3000
    from:
    - namespaceSelector: {}
  - ports:
    - protocol: TCP
      port: 3000
    from:
    - podSelector:
        matchLabels:
          app: visit-counter
EOF

```

HPA manifest:

```bash

#!/bin/bash
cat > kubernetes/hpa.yaml << 'EOF'
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: visit-counter-hpa
  namespace: visit-counter
  labels:
    app: visit-counter
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: visit-counter
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 30
EOF
```




10) Launching the image in Minikube:

    ```bash
    #! /bin/bash
    
    eval $(minikube docker-env)

    docker build -t visit-counter:1.0 .

    minikube image list
    ```

11) Deployment in Kubernetes:

```bash
#! /bin/bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
kubectl apply -f kubernetes/service-account.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/network-policy.yaml
kubectl apply -f kubernetes/hpa.yaml

```

12) Test in the Kubernetes:
```bash
#! /bin/bash

kubectl get pods -n visit-counter

kubectl port-forward service/visit-counter-service 8000:80 -n visit-counter
```
    
Test in new terminal:

```bash
!# /bin/bash
curl http://localhost:8000/
curl http://localhost:8000/health
curl http://localhost:8000/stats
```

13) Monitoring and management:

    ```bash
    #! /bin/bash        

    kubectl get all -n visit-counter
    
    kubectl describe deployment visit-counter -n visit-counter

    kubecrl logs -l app=visit-counter -n visit-counter --tail=5
    ```





                                                 CLEAR
Delete Kubernetes

Or all:
   
```bash
#! /bin/bash
kubectl delete -f kubernetes/
   
```

And chek:

```bash
!# /bin/bash

kubectl get all
kubectl get configmaps
kubectl get secrets
```

Stopped minikube:

```bash
!# /bin/bash

minikube stop
```

Exit out Docker environment Minikube:

```bash
!# /bin/bash
eval $(minikube docker-env -u)
```

Stop and deleete Docker containers and image:

```bash
!# /bin/bash

docker stop my-app 2>/dev/null && docker rm my-app 2>/dev/null

docker rmi visit-counter:1.0 2>/dev/null

cd ~

rm -rf express-kubernetes-vc

docker images | grep visit-counter

ls -la | grep express-kubernetes-vc

```
                                                   FAST CLEAR

```bash
!# /bin/bash

kubectl delete -f kubernetes/
minikube stop
eval $(minikube docker-env -u)
docker stop my-app && docker rm my-app
docker rmi visit-counter:1.0
cd ~ && rm -rf express-kubernetes-vc

```

   
