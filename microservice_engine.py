from typing import Dict, List, Any

class MicroserviceEngine:
    @staticmethod
    def propose_microservices(
        detected_modules: List[Dict[str, Any]], 
        domain: str
    ) -> Dict[str, Any]:
        services = []
        
        # Always include an API Gateway and an Auth Service
        services.append({
            "name": "API Gateway",
            "tech_stack": "NGINX / Node.js Proxy",
            "database": "Redis (Caching)",
            "responsibilities": [
                "Route request payloads to appropriate downstream micro-nodes.",
                "Enforce global rate limiting and SSL decryption rules."
            ],
            "dependencies": []
        })
        
        services.append({
            "name": "Authentication Service",
            "tech_stack": "Go / Gin & JWT",
            "database": "PostgreSQL (Users & Auth Tokens)",
            "responsibilities": [
                "Issue, refresh, and validate JSON Web Tokens.",
                "Manage user authentication schemas and MFA structures."
            ],
            "dependencies": ["API Gateway"]
        })

        # Create services based on detected modules
        for module in detected_modules:
            name = module["name"]
            if name in ["Authentication", "Authorization", "User & Workspace Management"]:
                continue # Covered by gateway/auth service
                
            service_name = f"{name.split('&')[0].strip()} Service"
            tech = "Python / FastAPI"
            db = f"SQLite / PostgreSQL ({name.split('&')[0].strip().lower()}_db)"
            
            if "Billing" in name or "Payment" in name:
                tech = "Node.js / NestJS"
                db = "PostgreSQL (Ledgers & Billing)"
            elif "Analytics" in name:
                tech = "Go / ClickHouse"
                db = "ClickHouse (Time-series logs)"

            services.append({
                "name": service_name,
                "tech_stack": tech,
                "database": db,
                "responsibilities": [
                    f"Isolate modules relating to {name}.",
                    f"Handle specialized event queues and API transactions for {name.lower()} logic."
                ],
                "dependencies": ["API Gateway", "Authentication Service"]
            })

        # Add default domain-specific microservice if none found
        if len(services) <= 2:
            clean_domain = domain.split("&")[0].strip()
            services.append({
                "name": f"{clean_domain} Core Service",
                "tech_stack": "Python / FastAPI",
                "database": "PostgreSQL (Core Domain Data)",
                "responsibilities": [
                    f"Manages core business workflows for {clean_domain}.",
                    "Houses domain logic, entities, and primary databases."
                ],
                "dependencies": ["API Gateway", "Authentication Service"]
            })

        # Create relationship edges for visual layouts
        edges = []
        for service in services:
            for dep in service["dependencies"]:
                edges.append({
                    "from": dep,
                    "to": service["name"],
                    "type": "HTTP/gRPC"
                })

        return {
            "services": services,
            "relationships": edges,
            "rationale": f"Decomposing the {domain} project into bounded contexts using domain-driven design guidelines. Each service is fully decoupled, supporting independent deployment schedules."
        }
