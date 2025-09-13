# 3-Tier Architecture Scenario with Terraform Configuration

Let us walk you through a complete scenario of how our Terraform architecture implements a 3-tier application stack, explaining the communication flow between all components.

## Scenario: Employee Application

Imagine we're deploying a typical Employee application with:
- **Frontend Tier**: React web application
- **Application Tier**: Node.js API services
- **Database Tier**: MySQL database for products, orders, and users

## Architecture Overview

```
Internet
    ↓
AWS Application Load Balancer (ALB)
    ↓
Kubernetes Service (Type: LoadBalancer)
    ↓
Frontend Pods (React App)
    ↓
Kubernetes Service (ClusterIP)
    ↓
Backend Pods (Node.js API)
    ↓
Kubernetes Service (ClusterIP)
    ↓
RDS MySQL Database
```

## Detailed Communication Flow

### 1. User Access (Presentation Tier)

```
User's Browser → Internet → ALB → Frontend Pods
```

**Step-by-step:**

1. A user opens their browser and navigates to `your-employee-site.com`
2. DNS resolves the domain to our ALB's DNS name (output `alb_dns_name`)
3. The user's request hits the ALB in our public subnets
4. The ALB listener (port 80/443) receives the request
5. The listener forwards the request to the target group (`dev-alb-tg`)
6. The target group routes the request to healthy frontend pods

**How this works in our infrastructure:**
- The ALB is deployed in our public subnets (`module.vpc.public_subnets`)
- The ALB uses the ALB security group (`module.security_group.alb_security_group_id`)
- The target group is configured to check pod health at the `/` endpoint
- The frontend pods are running in our private subnets (`module.vpc.private_subnets`)

### 2. Frontend to Backend Communication (Application Tier)

```
Frontend Pods → Backend Service → Backend Pods
```

**Step-by-step:**

1. The React app needs to fetch product data, so it makes an API call to `/api/products`
2. This request goes to a Kubernetes Service of type ClusterIP that exposes our backend API
3. Kubernetes' internal service discovery and networking routes the request to a healthy backend pod
4. The backend pod receives the request and processes it

**How this works in our infrastructure:**
- Both frontend and backend pods run on the same EKS cluster (`module.eks`)
- They're in the same VPC but in private subnets for security
- They communicate using Kubernetes' internal networking
- The EKS security group (`module.security_group.eks_security_group_id`) allows internal communication between pods

### 3. Backend to Database Communication (Data Tier)

```
Backend Pods → Database Security Group → RDS Instance
```

**Step-by-step:**

1. The backend API needs to fetch product information from the database
2. It establishes a connection to the RDS MySQL instance
3. The connection goes through the RDS security group
4. The security group validates that the connection is coming from an authorized source (our EKS pods)
5. The query is executed, and results are returned to the backend pod

**How this works in our infrastructure:**
- The RDS instance is in our database subnets (`module.vpc.database_subnets`)
- The RDS security group (`module.security_group.rds_security_group_id`) only allows connections from the EKS security group
- The backend pods use the RDS endpoint (`module.rds.rds_instance_endpoint`) to connect
- All database traffic stays within the VPC, never touching the public internet

### 4. Backend to External Services

```
Backend Pods → NAT Gateway → Elastic IP → Internet → External APIs
```

**Step-by-step:**

1. The backend needs to process a payment through an external payment gateway
2. The request goes from the backend pod to the NAT Gateway in the same AZ
3. The NAT Gateway uses the Elastic IP to make the request appear as if it's coming from a static IP
4. The external payment API receives the request and processes the payment
5. The response follows the reverse path back to the backend pod

**How this works in our infrastructure:**
- Backend pods are in private subnets and can't directly access the internet
- Each AZ has a NAT Gateway with an Elastic IP for outbound internet access
- The route tables for private subnets direct internet-bound traffic to the NAT Gateway
- This allows our pods to access external services while remaining private

## Security and Isolation in Our 3-Tier Architecture

### Network Isolation

1. **Public Subnets**: Only contain the ALB and NAT Gateways
   - ALB receives inbound traffic from the internet
   - NAT Gateways enable outbound internet access for private resources

2. **Private Subnets**: Contain our EKS worker nodes and pods
   - No direct inbound access from the internet
   - Can communicate with other resources in the VPC
   - Can access the internet through NAT Gateways

3. **Database Subnets**: Contain only our RDS instance
   - Most restricted subnet, only accessible from the application tier
   - No direct internet access

### Security Groups

1. **ALB Security Group**:
   - Allows inbound HTTP/HTTPS traffic from anywhere (0.0.0.0/0)
   - Allows outbound traffic to the EKS security group

2. **EKS Security Group**:
   - Allows inbound traffic from the ALB security group
   - Allows all internal traffic between pods
   - Allows outbound traffic to the RDS security group and to the internet (via NAT)

3. **RDS Security Group**:
   - Only allows inbound MySQL traffic (port 3306) from the EKS security group
   - Allows outbound traffic (for backups, etc.)

## IAM and Access Control

1. **EKS Cluster Role** (`module.iam.eks_cluster_role_arn`):
   - Allows the EKS control plane to manage AWS resources
   - Permissions to create and manage ELB resources, EC2 instances, etc.

2. **EKS Node Role** (`module.iam.eks_node_role_arn`):
   - Allows worker nodes to join the EKS cluster
   - Permissions to pull container images from ECR
   - Permissions to manage network interfaces

## High Availability and Scalability

### High Availability

1. **Multi-AZ Deployment**:
   - Our resources are spread across multiple Availability Zones
   - If one AZ fails, the others continue to operate
   - RDS is configured for multi-AZ deployment (though not explicitly shown in our code)

2. **Load Balancing**:
   - ALB distributes traffic across healthy pods in all AZs
   - If a pod or node fails, the ALB automatically stops sending traffic to it

### Scalability

1. **EKS Node Group Scaling**:
   - Configured with min_size=1, desired_size=2, max_size=3
   - Can automatically scale based on resource demands
   - When pods can't be scheduled due to insufficient resources, new nodes are added

2. **Pod Scaling**:
   - Kubernetes Horizontal Pod Autoscaler can scale pods based on CPU/memory usage
   - Combined with node scaling, this provides end-to-end scalability

## Real-World Request Flow Example

Let's trace a complete user journey through our 3-tier architecture:

### 1. User Browses Products (Read-Heavy Operation)

```
User's Browser → Internet → ALB → Frontend Pod → Backend Service → Backend Pod → RDS → Backend Pod → Frontend Pod → ALB → User's Browser
```

**Step-by-step:**

1. A user navigates to our e-commerce site
2. The request hits the ALB, which routes it to a frontend pod
3. The React app loads and makes an API call to fetch products
4. The request goes to a backend pod through the Kubernetes service
5. The backend pod queries the RDS database for product information
6. The database returns the product data to the backend pod
7. The backend pod formats the data as JSON and returns it to the frontend
8. The frontend renders the product catalog and sends it to the user's browser

### 2. User Places an Order (Write-Heavy Operation)

```
User's Browser → Internet → ALB → Frontend Pod → Backend Service → Backend Pod → RDS (Write) → Backend Pod → External Payment API → Backend Pod → RDS (Update) → Backend Pod → Frontend Pod → ALB → User's Browser
```

**Step-by-step:**

1. A user adds items to their cart and clicks "Checkout"
2. The frontend sends the order details to the backend API
3. The backend pod receives the order and begins processing
4. It first writes the order to the RDS database
5. Then, it calls an external payment API through the NAT Gateway
6. The payment API confirms the payment
7. The backend updates the order status in the database
8. It sends a confirmation to the frontend
9. The frontend displays the order confirmation to the user

## Disaster Recovery Scenario

### What Happens When an AZ Fails?

1. **Detection**: AWS detects the AZ failure
2. **ALB Response**: The ALB health checks detect failed targets in the affected AZ
3. **Traffic Rerouting**: The ALB stops sending traffic to the failed AZ
4. **Database Failover**: RDS automatically fails over to the standby instance in another AZ
5. **NAT Gateway Failover**: Outbound traffic continues through NAT Gateways in healthy AZs
6. **Continued Operation**: The application continues to serve users with reduced capacity

## Summary

Our Terraform architecture creates a robust, scalable, and secure 3-tier application stack:

1. **Presentation Tier**: Frontend pods served through an ALB
2. **Application Tier**: Backend pods processing business logic
3. **Data Tier**: RDS MySQL database storing application data

The architecture provides:
- **Security**: Through network isolation and security groups
- **High Availability**: Through multi-AZ deployment and automatic failover
- **Scalability**: Through EKS node group scaling and pod autoscaling
- **Monitoring**: Through health checks and logging
- **Cost Efficiency**: Through auto-scaling and right-sized resources

This setup is ideal for modern cloud-native applications that need to handle variable workloads while maintaining high availability and security.