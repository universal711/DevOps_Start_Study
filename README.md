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
                {
                  "name" : "visit-counter",
                  "dependecies": {
                    "express": "^4.18.2"
                    }
                }
            ```
        
  
        Create server.js:
      ```bash
      #! /bin/bash
            
      cat > server.js << 'EOF'

                const express = require('express');
                const app = express();
                const PORT = process.env.PORT || 3000;
                
                // Переменная для хранения счетчика
                let visitCount = 0;
                
                // Middleware для логирования запросов
                app.use((req, res, next) => {
                  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
                  next();
                });
                
                // Основной endpoint - счетчик посещений
                app.get('/', (req, res) => {
                  visitCount++;
                  res.json({
                    message: '🚀 Hello from Docker & Kubernetes!',
                    visitCount: visitCount,
                    timestamp: new Date().toISOString(),
                    containerId: process.env.HOSTNAME || 'local'
                  });
                });
                
                // Health check endpoint
                app.get('/health', (req, res) => {
                  res.json({ 
                    status: 'OK', 
                    service: 'visit-counter',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime()
                  });
                });
                
                // Endpoint для получения статистики
                app.get('/stats', (req, res) => {
                  res.json({
                    totalVisits: visitCount,
                    serverTime: new Date().toISOString(),
                    uptime: process.uptime()
                  });
                });
                
                // Обработка 404 ошибок
                app.use('*', (req, res) => {
                  res.status(404).json({
                    error: 'Endpoint not found',
                    availableEndpoints: [
                      'GET /',
                      'GET /health',
                      'GET /stats'
                    ]
                  });
                });
                
                // Запуск сервера
                app.listen(PORT, '0.0.0.0', () => {
                  console.log(`Server started on port ${PORT}`);
                  console.log(`Health check: http://localhost:${PORT}/health`);
                  console.log(`Main endpoint: http://localhost:${PORT}/`);
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


6) Create dockerfile:

   ```bash
   #! /bin/bash
            
   cat > Dockerfile << 'EOF'

   FROM node:18-alpine
       
   WORKDIR /app
    
   COPY app/package.json ./
    
   RUN npm install
    
   COPY app/server.js ./
    
   EXPOSE 3000
    
   CMD["node", "server.js"]

   EOF
   ```

8) Check:

   ```bash
   #! /bin/bash
            
   cat Dockerfile

   ```
   
7)Build and start in DOCKER:

   ```bash
   #! /bin/bash
            

    docker build -t visit-counter:1.0 .
    
    docker image | grep visit-counter
    
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
    
        script:
            apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: visit-counter
      labels:
        app: visit-counter
    spec:
      replicas: 3
      selector:
        matchLabels:
          app: visit-counter
      template:
        metadata:
          labels:
            app: visit-counter
        spec:
          containers:
          - name: visit-counter
            image: visit-counter:1.0
            imagePullPolicy: Never  # Используем локальный образ
            ports:
            - containerPort: 3000
            env:
            - name: PORT
              value: "3000"
            livenessProbe:
              httpGet:
                path: /health
                port: 3000
              initialDelaySeconds: 5
              periodSeconds: 10
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
   #! /bin/bash
            
        cat > kubernetes/service.yaml << 'EOF'

            script:
                apiVersion: v1
        kind: Service
        metadata:
          name: visit-counter-service
        spec:
          selector:
            app: visit-counter
          ports:
            - protocol: TCP
              port: 80
              targetPort: 3000
          type: LoadBalancer

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
    
    kubectl apply -f kubernetes/deployment.yaml

    kubectl apply -f kubernetes/service.yaml

    kubectl get deployments
    kubectl get pods
    kubectl get services

    kubectl logs -f <pod-name> - replace pod-name with name of the pod whose logs you want look
    ```

16) Test in the Kubernetes:
    ```bash
    #! /bin/bash
    
    minikube srvices visit-counter-services --url

    kubectl port-forward service/visit-counter-service 8000:80

    Test in new terminal:
        curl http://localhost:8000/
        curl http://localhost:8000/health
        curl http://localhost:8000/stats
    ```

18) Monitoring and management:

    ```bash
    #! /bin/bash        

        kubectl get all
    
        kubectl describe deployment visit-counter
    
        kubectl scale deployment visit-counter --replicas=5
    
        kubectl get pods
    ```
