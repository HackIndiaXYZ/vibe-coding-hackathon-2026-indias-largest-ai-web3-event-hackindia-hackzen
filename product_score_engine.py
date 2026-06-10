from typing import Dict, List, Any

class ProductScoreEngine:
    @staticmethod
    def calculate_score(
        scanner_results: Dict[str, Any], 
        detected_modules: List[Dict[str, Any]], 
        domain_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        parsed_data = scanner_results.get("parsed_data", {})
        
        file_count = scanner_results.get("file_count", 0)
        func_count = len(parsed_data.get("functions", []))
        class_count = len(parsed_data.get("classes", []))
        db_model_count = len(parsed_data.get("db_models", []))
        route_count = len(parsed_data.get("routes", []))
        module_count = len(detected_modules)

        # 1. Modularity: based on classes and files ratio, and modules found
        # More files with distinct classes/functions = more modular
        modularity = 50
        if file_count > 0:
            density = (func_count + class_count) / file_count
            if 2 <= density <= 15:
                modularity += 30
            elif density > 15:
                modularity += 15  # too monolithic/large files
            else:
                modularity += 10
        modularity += min(module_count * 5, 20)
        modularity = min(modularity, 100)

        # 2. Reusability: helper libraries, standard schemas
        reusability = 60
        reusability += min(class_count * 2, 20)
        # Look for utils/helper files
        has_utils = any("util" in f["path"].lower() or "helper" in f["path"].lower() for f in parsed_data.get("raw_files", []))
        if has_utils:
            reusability += 15
        reusability = min(reusability, 100)

        # 3. Scalability: routes and db schemas
        # Database models + HTTP routes indicate API readiness and scalability
        scalability = 45
        scalability += min(db_model_count * 5, 25)
        scalability += min(route_count * 3, 25)
        # Check if they have Docker container settings
        has_docker = any("docker" in f.lower() for f in scanner_results.get("tech_stack", []))
        if has_docker:
            scalability += 10
        scalability = min(scalability, 100)

        # 4. Architecture Quality: clean division of routes, models, business rules
        architecture_quality = 55
        if route_count > 0 and db_model_count > 0:
            architecture_quality += 20
        # If there are multiple folders/layers
        if scanner_results.get("folder_count", 0) > 4:
            architecture_quality += 15
        architecture_quality = min(architecture_quality, 100)

        # 5. Business Value: billing, auth, reports increase commercial readiness
        business_value = 50
        has_billing = any("billing" in m["name"].lower() or "payment" in m["name"].lower() for m in detected_modules)
        has_crm = any("crm" in m["name"].lower() for m in detected_modules)
        if has_billing:
            business_value += 25
        if has_crm:
            business_value += 15
        # High confidence in domain helps
        business_value += int(domain_info.get("confidence", 70) * 0.15)
        business_value = min(business_value, 100)

        # 6. Market Applicability
        market_applicability = 65
        # Certain domains are highly applicable
        popular_domains = ["Healthcare", "Finance & Banking", "E-Commerce & Retail", "Enterprise CRM & Sales"]
        if domain_info.get("domain") in popular_domains:
            market_applicability += 15
        market_applicability += min(route_count, 15)
        market_applicability = min(market_applicability, 100)

        # Calculate final composite score
        composite_score = int(
            (modularity + reusability + scalability + architecture_quality + business_value + market_applicability) / 6
        )

        # Clamp between 20 and 99 for realism
        composite_score = max(min(composite_score, 99), 20)

        return {
            "overall_score": composite_score,
            "breakdown": {
                "modularity": modularity,
                "reusability": reusability,
                "scalability": scalability,
                "architecture_quality": architecture_quality,
                "business_value": business_value,
                "market_applicability": market_applicability
            }
        }
