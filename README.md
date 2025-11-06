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
   
      ```
      cd ..

      node --version (if you received version - good, else go to install)
    
      else: node server.js
    
      npm --version (if you received version - good, else go to install)
    
      else: npm install

      ```

   In the second terminal:

      ```
      cd ~/express-kubernetes-vc
      curl http://localhost:3000/
      curl http://localhost:3000/health
      curl http://localhost:3000/stats
      ```


6) Create dockerfile and .dockerignore file:

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

   

7) Check:

   ```bash
   #! /bin/bash
            
   cat Dockerfile

   ```
   
7)Build and start in DOCKER:

   ```bash
   #! /bin/bash
            

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

8)Stop container:

   ```bash
   #! /bin/bash
            
    docker stop my-app
    docker rm my-app
   ```

9)Work with Kubernetes(minikube):

   ```bash
   #! /bin/bash
            
    minikube start
    minikube status
    kubectl get nodes
   ```
    
10) Create Kubernetes manifests:
    Deployment manifest:

    ```bash
    #! /bin/bash
            
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
            annotations:
              prometheus.io/scrape: "true"
              prometheus.io/port: "3000"
              prometheus.io/path: "/metrics"
          spec:
            serviceAcoountName: visit-counter-sa
            securityContext:
              runAsNonRoot: true
              runAsUser: 1001
              runAsGroup: 1001
              fsGroup: 1001
              seccompProfile:
                type: RuntimeDefault
            containers:
            - name: visit-counter
              image: visit-counter:1.0
              imagePullPolicy: IfNotPresent
              ports:
              - containerPort: 3000
                protocol: TCP
              env:
              - name: PORT
                valueFrom:
                  configMapKeyRef:
                    name: visit-counter-config
                    key: PORT
              - name: NODE_ENV
                valueFrom:
                  configMapKeyRef:
                    name: visit-counter-config
                    key: NODE_ENV
              - name: API_KEY
                valueFrom:
                  secretKeyRef:
                    name: visit-counter-secret
                    key: api-key
              securityContext:
                allowPrivilegeEscalation: false
                runAsNonRoot: true
                runAsUser: 1001
                readOnlyRootFilesystem: true
                capabilities:
                  drop:
                    - ALL
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
                  scheme: HTTP
                initialDelaySeconds: 10
                periodSeconds: 15
                timeoutSeconds: 5
                failureThreshold: 3
              readinessProbe:
                httpGet:
                  path: /health
                  port: 3000
                  scheme: HTTP
                initialDelaySeconds: 5
                periodSeconds: 10
                timeoutSeconds: 3
                failureThreshold: 2
              lifecycle:
                preStop:
                  exec:
                    command: ["/bin/sh", "-c", "sleep 5"]
    EOF
    ```
    
    Service manifest:
    
   ```bash
   #! /bin/bash
   cat > kubernetes/service.yaml << 'EOF'
   apiVersion: v1
   kind: Service
   metadata:
     name: visit-counter-service
     labels:
       app: visit-counter
     annotations:
       prometheus.io/scrape: "true"
       prometheus.io/port: "3000"
       prometheus.io/path: "/metrics"
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

   ConfigMap manifest:
   
   ```bash
   #! /bin/bash

      cat > kubernetes/configmap.yaml << 'EOF'
      apiVersion: v1
      kind: ConfigMap
      metadata:
        name: visit-counter-config
        labels:
          app: visit-counter
      data:
        PORT: "3000"
        NODE_ENV: "production"
        LOG_LEVEL: "info"
      EOF

   ```



   Namespace manifest:
   ```bash
   !# /bin/bash
   cat > kubernetes/namespace.yaml << 'EOF'
   apiVersion: v1
   kind: Namespace
   metadata:
     name: visit-counter
     labels:
       name: visit-counter
   EOF
   ```
   

   Secret manifest:
   ```bash
   #! /bin/bash

   cat > kubernetes/secret.yaml << 'EOF'
   apiVersion: v1
   kind: Secret
   metadata:
     name: visit-counter-secret
     labels:
       app: visit-counter
   type: Opaque
   data:
     # echo -n 'my-super-secret-api-key' | base64
     api-key: bXktc3VwZXItc2VjcmV0LWFwaS1rZXk=
   EOF

   ```

   Network Policy:
   ```bash
   #! /bin/bash

   cat > kubernetes/network-policy.yaml << 'EOF'
   
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: visit-counter-network-policy
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


   Horizantal Pod Autoscaler:
   ```bash
   #! /bin/bash
      cat > kubernetes/hpa.yaml << 'EOF'
      apiVersion: autoscaling/v2
      kind: HorizontalPodAutoscaler
      metadata:
        name: visit-counter-hpa
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


   Service Account:
   ```bash
   #! /bin/bash
   cat > kubernetes/service-account.yaml << 'EOF'
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: visit-counter-sa
     labels:
       app: visit-counter
   automountServiceAccountToken: false
   EOF
   ```
    
   

12) Launching the image in Minikube:

    ```bash
    #! /bin/bash
    
    eval $(minikube docker-env)

    docker build -t visit-counter:1.0 .

    minikube image list
    ```

14) Deployment in Kubernetes:

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

16) Test in the Kubernetes:
    ```bash
    #! /bin/bash
    
    minikube srvice visit-counter-service --url -n visit-counter

    kubectl port-forward service/visit-counter-service 8000:80 -n visit-counter

    Test in new terminal:
        curl http://localhost:8000/
        curl http://localhost:8000/health
        curl http://localhost:8000/stats
    ```

18) Monitoring and management:

    ```bash
    #! /bin/bash        

    kubectl get all -n visit-counter
    
    kubectl describe deployment visit-counter -n visit-counter

    kubecrl logs -l app=visit-counter -n visit-counter --tail=50
    
    ```





                                                 CLEAR

1) Delete Kubernetes

   Or all:
   
   ```bash
   #! /bin/bash
   kubectl delete -f kubernetes/
   
   ```

   Or what you need:
   ```bash
   !# /bin/bash
   kubectl delete deployment visit-counter
   kubectl delete service visit-counter-service
   kubectl delete configmap visit-counter-config
   kubectl delete secret visit-counter-secret
   kubectl delete networkpolicy visit-counter-network-policy
   kubectl delete hpa visit-counter-hpa
   kubectl delete serviceaccount visit-counter-sa
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

   Full delete cluster:

   ```bash
   !# bin/bash
   minikube delete
   ```

   Exit out Docker environment Minikube:

   ```bash
   !# /bin/bash
   eval $(minikube docker-env -u)
   ```

   Stop and deleete Docker containers and image:

   ```bash
   !# /bin/bash

   docker stop my-app
   docker rm my-app

   docker rmi visit-counter:1.0

   docker images | grep visit-counter

   docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"

   docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
   ```

   Delete project's files:

   ```bash
   !# /bin/bash
   
   cd ~/express-kubernetes-vc

   cd ..
   
   rm -rf express-kubernetes-vc

   ```

   Chek:
   
   ```bash
   !# /bin/bash
   ls -la | grep express-kubernetes-vc
   ```

   CLear system perocess:

   Chek ports:
   ```bash
   !# /bin/bash
   lsof -i :3000
   lsof -i :8000
   ```

   If port/ports work:
   ```bash
   !# /bin/bash
   kill -9 <PID>
   !#replace PID on real
   ```


                                                   FAST CLEAR

```bash
!# /bin/bash

kubectl delete -f kubernetes/
minikube stop
docker stop my-app && docker rm my-app
docker rmi visit-counter:1.0
cd .. && rm -rf express-kubernetes-vc

```

   
