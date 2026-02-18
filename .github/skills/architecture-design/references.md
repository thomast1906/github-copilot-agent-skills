# Architecture Design - Service Selection Reference

## Compute Services

### Decision Tree
```
Need full OS control?
├─ YES → Virtual Machines or VM Scale Sets
└─ NO  → Is it containerized?
          ├─ YES → Need Kubernetes orchestration?
          │        ├─ YES → Azure Kubernetes Service (AKS)
          │        └─ NO  → Container Apps
          └─ NO  → Is it event-driven/short-lived?
                   ├─ YES → Azure Functions or Logic Apps
                   └─ NO  → Azure App Service

**Recommendation Priority:** PaaS > Containers > IaaS
```

### Service Comparison

| Service | Best For | Avoid When | Cost Range |
|---------|----------|------------|------------|
| **App Service** | Web apps, APIs, standard workloads | Need OS control | $15-500/month |
| **Container Apps** | Containerized apps without K8s complexity | Need advanced K8s features | $20-400/month |
| **Azure Functions** | Event-driven, sporadic workloads | Long-running processes | $0-200/month |
| **AKS** | Complex microservices, multiple containers | Simple single app | $150-2000/month |
| **VMs** | Legacy apps, full OS control needed | Modern cloud-native apps | $30-1000/month |

## Data Storage Services

### Relational Databases

| Service | Best For | Max DB Size | Cost Range |
|---------|----------|-------------|------------|
| **Azure SQL Database** | SQL Server workloads, managed PaaS | 4 TB | $5-15,000/month |
| **Azure SQL Managed Instance** | Lift-and-shift SQL Server | 16 TB | $600-20,000/month |
| **PostgreSQL** | Open-source, advanced features, JSON | 16 TB | $5-10,000/month |
| **MySQL** | Open-source, wide adoption | 16 TB | $5-8,000/month |

### NoSQL Databases

| Service | Best For | Key Features | Cost Range |
|---------|----------|--------------|------------|
| **Cosmos DB** | Global distribution, <10ms latency | Multi-model, 99.999% SLA | $25-10,000/month |
| **Table Storage** | Simple key-value, cost-effective | Eventual consistency | $1-100/month |
| **Redis Cache** | In-memory cache, sessions | Microsecond latency | $15-1,000/month |

### Files & Blobs

| Service | Best For | Access Pattern | Cost Range |
|---------|----------|----------------|------------|
| **Blob Storage** | Objects, media, backups, data lakes | Hot/Cool/Archive tiers | $20-2,000/month |
| **Azure Files** | SMB file shares, lift-and-shift | Standard/Premium | $10-500/month |
| **Data Lake Gen2** | Big data analytics | Hierarchical namespace | $20-5,000/month |

## Messaging & Integration

| Service | Use Case | Message Pattern | Cost Range |
|---------|----------|-----------------|------------|
| **Storage Queues** | Simple, cost-effective queuing | FIFO, at-least-once | $0-10/month |
| **Service Bus** | Enterprise messaging, guaranteed delivery | FIFO, transactions, dead-letter | $10-500/month |
| **Event Hubs** | Big data streaming, IoT telemetry | High throughput (millions/sec) | $20-2,000/month |
| **Event Grid** | Event-driven automation, pub-sub | Reactive, serverless | $0-100/month |
| **Logic Apps** | Visual workflow orchestration | 400+ connectors, low-code | $0-500/month |
| **Durable Functions** | Code-first workflow orchestration | Complex patterns, stateful | $5-200/month |

## Networking Services

| Service | Best For | Cost Range |
|---------|----------|------------|
| **Azure Front Door** | Global CDN, WAF, multi-region LB | $35-2,000/month |
| **Application Gateway** | Regional L7 load balancer, WAF | $150-1,000/month |
| **Load Balancer** | Regional L4 load balancing | Basic: Free, Standard: $20-200/month |
| **VPN Gateway** | Hybrid connectivity (encrypted) | $30-300/month |
| **ExpressRoute** | Dedicated private connection | $50-5,000/month |
| **Azure Firewall** | Managed firewall, threat intelligence | $1,200-5,000/month |

## Monitoring Services

| Service | Purpose | Data Ingestion Cost |
|---------|---------|---------------------|
| **Application Insights** | Application telemetry, dependencies | $2.50/GB after 5GB free |
| **Log Analytics** | Centralized logs, queries | $2.76/GB after free tier |
| **Azure Monitor** | Metrics, alerts, workbooks | Included (per resource) |

## Service Selection Guidelines

### PaaS vs IaaS Decision Matrix

| Requirement | Choose PaaS | Choose IaaS |
|-------------|------------|-------------|
| Standard web/API app | App Service | VM |
| Need OS patches managed | App Service | VM |
| Legacy app with specific OS config | App Service | VM |
| Specialized software/drivers | App Service | VM |
| Cost optimization | App Service | VM |
| Team familiar with servers | App Service (learn) 🟡 | VM |

### Database Selection Decision Tree

```
What type of data?

RELATIONAL (tables, SQL, ACID):
├─ Need SQL Server features? → Azure SQL Database/Managed Instance
├─ Want open-source? → PostgreSQL or MySQL
└─ Simple queries, budget-conscious? → Azure SQL (Basic/Standard tier)

NOSQL:
├─ Global distribution needed? → Cosmos DB
├─ Simple key-value? → Table Storage
├─ In-memory cache? → Redis Cache
└─ Document store with flexibility? → Cosmos DB (MongoDB API)

FILES/OBJECTS:
├─ Unstructured data (images, videos)? → Blob Storage
├─ File shares (SMB)? → Azure Files
└─ Big data analytics? → Data Lake Gen2
```

### Messaging Service Selection

```
What's your messaging pattern?

COMMANDS (one receiver):
├─ Simple, cost-effective? → Storage Queues
└─ Enterprise features (FIFO, transactions)? → Service Bus Queues

EVENTS (multiple receivers):
├─ High-throughput streaming? → Event Hubs
├─ Reactive, serverless? → Event Grid
└─ Point-to-point with reliability? → Service Bus Topics

WORKFLOWS:
├─ Visual designer, many connectors? → Logic Apps
└─ Code-first, complex patterns? → Durable Functions
```

## Common Combinations

### Web Application Stack
```
Azure Front Door (CDN + WAF)
└─ App Service (Web + API)
   ├─ Redis Cache (Session/Data)
   ├─ Azure SQL (Primary data)
   └─ Blob Storage (Media files)
```

### Microservices Stack
```
API Management (Gateway)
├─ Container Apps / AKS (Services)
├─ Service Bus (Inter-service messaging)
├─ Cosmos DB (Service A data)
└─ Azure SQL (Service B data)
```

### Data Platform Stack
```
Data Factory (ETL orchestration)
├─ Data Lake Gen2 (Raw data)
├─ Databricks / Synapse (Processing)
└─ Power BI (Visualization)
```

### IoT Platform Stack
```
IoT Hub (Device management)
└─ Event Hubs (Telemetry ingestion)
   ├─ Stream Analytics (Real-time)
   ├─ Functions (Processing)
   └─ Data Lake (Cold path)
```

## Regional Considerations

### Multi-Region Patterns

**Active-Active:**
- Both regions handle traffic simultaneously
- Highest availability (99.999%+)
- Highest cost (duplicate infrastructure)
- Use: Mission-critical, global apps

**Active-Passive:**
- Primary region active, secondary on standby
- Good availability (99.99%+)
- Moderate cost (standby infrastructure)
- Use: Business-critical apps with DR requirements

**Single Region + Availability Zones:**
- Multiple zones in one region
- Good availability (99.99%)
- Lowest cost
- Use: Most production workloads

### Paired Regions

Always design multi-region using Azure paired regions for automatic geo-replication benefits:

| Primary | Paired Region |
|---------|---------------|
| East US | West US |
| East US 2 | Central US |
| West Europe | North Europe |
| UK South | UK West |
| Southeast Asia | East Asia |

## Cost Optimization Patterns

### Right-Sizing Strategy

| Resource Type | Analysis Method | Typical Savings |
|---------------|-----------------|-----------------|
| VMs | 30-day CPU/memory average < 40% | 30-50% |
| App Service Plans | Multiple apps, low utilization | 40-60% (consolidation) |
| SQL Database | DTU/vCore average < 50% | 30-40% |
| Storage | Access patterns, lifecycle policies | 50-90% (cold tiers) |

### Reserved Instances Savings

| Service | 1-Year | 3-Year |
|---------|--------|--------|
| VMs | 20-40% | 40-72% |
| App Service | 20-30% | 30-50% |
| Azure SQL | 30-40% | 50-65% |
| Cosmos DB | 20-30% | 30-65% |

### Auto-Scaling Configuration

```
Production App Service Example:
- Min instances: 2 (HA requirement)
- Max instances: 10 (cost control)
- Scale out: CPU > 70% for 5 minutes
- Scale in: CPU < 30% for 10 minutes
- Cool-down: 5 minutes (scale out), 10 minutes (scale in)

Result: Balanced between availability and cost
```

## Security Defaults

Every architecture must include:

**Managed Identities** - No credentials in code
**Private Endpoints** - No public internet exposure for PaaS
**HTTPS Only** - TLS 1.2+ enforced
**NSGs** - Network security groups with least privilege
**Key Vault** - All secrets, certificates, keys
**Azure AD** - Authentication and RBAC
**Encryption** - At rest (default) and in transit

## High Availability Defaults

Every production architecture must include:

**Availability Zones** - Minimum for production
**Multiple Instances** - At least 2 for stateless services
**Health Checks** - Configured on all services
**Auto-Scaling** - Defined rules based on metrics
**Backup Strategy** - RPO/RTO defined and tested
**Monitoring** - Application Insights + Log Analytics
**Alerts** - Critical scenarios with proper routing
