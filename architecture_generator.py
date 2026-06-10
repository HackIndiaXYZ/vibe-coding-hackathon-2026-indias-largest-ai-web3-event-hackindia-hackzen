from typing import Dict, List, Any

class ArchitectureGenerator:
    @staticmethod
    def generate_diagram(microservice_proposal: Dict[str, Any]) -> Dict[str, Any]:
        services = microservice_proposal.get("services", [])
        
        nodes = []
        edges = []
        
        # 1. Add Frontend Client
        nodes.append({
            "id": "frontend",
            "type": "customNode",
            "position": {"x": 50, "y": 250},
            "data": {
                "label": "React Frontend",
                "subtitle": "Vite + TailwindCSS",
                "category": "frontend",
                "icon": "layout"
            }
        })
        
        # 2. Add API Gateway
        nodes.append({
            "id": "gateway",
            "type": "customNode",
            "position": {"x": 250, "y": 250},
            "data": {
                "label": "API Gateway",
                "subtitle": "Reverse Proxy & Rate Limit",
                "category": "gateway",
                "icon": "shuffle"
            }
        })
        
        edges.append({
            "id": "e-front-gate",
            "source": "frontend",
            "target": "gateway",
            "animated": True,
            "style": {"stroke": "#8b5cf6", "strokeWidth": 2}
        })

        # Track heights for vertical spacing
        service_idx = 0
        db_idx = 0

        for service in services:
            name = service["name"]
            if name == "API Gateway":
                continue # Already added
                
            node_id = name.lower().replace(" ", "_").replace("&", "and")
            
            # Position microservices vertically
            x = 480
            y = 80 + (service_idx * 130)
            service_idx += 1
            
            is_auth = "auth" in node_id or "authentication" in node_id
            category = "auth" if is_auth else "service"
            icon = "shield" if is_auth else "cpu"
            
            nodes.append({
                "id": node_id,
                "type": "customNode",
                "position": {"x": x, "y": y},
                "data": {
                    "label": name,
                    "subtitle": service["tech_stack"],
                    "category": category,
                    "icon": icon
                }
            })
            
            # Edge from Gateway to Service
            edges.append({
                "id": f"e-gate-{node_id}",
                "source": "gateway",
                "target": node_id,
                "animated": True,
                "style": {"stroke": "#3b82f6", "strokeWidth": 1.5}
            })
            
            # 3. Add Databases next to their corresponding service
            db_name = service["database"]
            if db_name:
                db_id = f"db_{node_id}"
                db_x = 750
                db_y = y - 10
                
                # Check for special third party indicators
                is_third_party = "stripe" in db_name.lower() or "paypal" in db_name.lower()
                db_category = "thirdparty" if is_third_party else "database"
                db_icon = "external-link" if is_third_party else "database"
                
                nodes.append({
                    "id": db_id,
                    "type": "customNode",
                    "position": {"x": db_x, "y": db_y},
                    "data": {
                        "label": db_name.split(" (")[0],
                        "subtitle": db_name.split(" (")[-1].replace(")", "") if " (" in db_name else db_name,
                        "category": db_category,
                        "icon": db_icon
                    }
                })
                
                # Edge from Service to Database
                edges.append({
                    "id": f"e-{node_id}-{db_id}",
                    "source": node_id,
                    "target": db_id,
                    "style": {"stroke": "#10b981", "strokeDasharray": "5 5", "strokeWidth": 1.5}
                })
                
                # Add link from auth service to other services for token check
                if not is_auth and any("auth" in n["id"] for n in nodes):
                    auth_node_id = [n["id"] for n in nodes if "auth" in n["id"]][0]
                    edges.append({
                        "id": f"e-{auth_node_id}-{node_id}",
                        "source": auth_node_id,
                        "target": node_id,
                        "style": {"stroke": "#cbd5e1", "strokeWidth": 1, "opacity": 0.6}
                    })

        return {
            "nodes": nodes,
            "edges": edges
        }
