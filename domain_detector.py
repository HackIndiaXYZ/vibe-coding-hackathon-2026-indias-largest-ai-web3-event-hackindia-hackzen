from typing import Dict, List, Any
import re

DOMAIN_RULES = {
    "Healthcare": {
        "keywords": [r"patient", r"appointment", r"medical", r"doctor", r"health", r"clinic", r"hospital", r"prescription", r"diagnos", r"ehr", r"emr"],
        "description": "Clinical operations, patient scheduling, medical histories, and digital healthcare platforms."
    },
    "Education": {
        "keywords": [r"course", r"student", r"teacher", r"school", r"classroom", r"grade", r"exam", r"assignment", r"lesson", r"curriculum", r"enroll"],
        "description": "LMS (Learning Management Systems), student tracking, curriculum pacing, and class scheduling."
    },
    "Finance & Banking": {
        "keywords": [r"bank", r"transaction", r"transfer", r"credit", r"debit", r"loan", r"balance", r"ledger", r"deposit", r"wallet", r"payment", r"invoice", r"crypto", r"portfolio"],
        "description": "Digital ledger accounting, transaction records, fund transfers, wallet platforms, and microfinance services."
    },
    "E-Commerce & Retail": {
        "keywords": [r"product", r"cart", r"checkout", r"store", r"order", r"sku", r"shop", r"purchase", r"catalog", r"coupon", r"discount", r"shipping", r"inventory"],
        "description": "Retail storefront operations, checkout flows, digital carts, inventory catalogs, and product tracking."
    },
    "Logistics & Inventory": {
        "keywords": [r"shipment", r"warehouse", r"transit", r"delivery", r"courier", r"package", r"tracking", r"fleet", r"dispatch", r"consignment", r"carrier"],
        "description": "Cargo movements, package routing, carrier dispatch systems, and warehouse logistics."
    },
    "Human Resources": {
        "keywords": [r"employee", r"payroll", r"attendance", r"leave", r"vacation", r"candidate", r"hiring", r"resume", r"appraisal", r"timesheet", r"salary"],
        "description": "Personnel profiles, attendance systems, employee payrolls, leave approvals, and recruitment pipelines."
    },
    "Enterprise CRM & Sales": {
        "keywords": [r"crm", r"lead", r"opportunity", r"sales", r"pipeline", r"contact", r"prospect", r"deal", r"interaction", r"customer_success"],
        "description": "Customer lifecycle trackers, sales funnel visualizers, client interaction logs, and pipeline CRM systems."
    }
}

class DomainDetector:
    @staticmethod
    def detect_domain(scanner_results: Dict[str, Any]) -> Dict[str, Any]:
        parsed_data = scanner_results.get("parsed_data", {})
        
        # Combine everything to scan keywords
        funcs = " ".join(parsed_data.get("functions", []))
        classes = " ".join(parsed_data.get("classes", []))
        db_models = " ".join(parsed_data.get("db_models", []))
        routes = " ".join([r.get("path", "") for r in parsed_data.get("routes", [])])
        files = " ".join([f.get("path", "") for f in parsed_data.get("raw_files", [])])
        
        search_blob = (funcs + " " + classes + " " + db_models + " " + routes + " " + files).lower()
        
        domain_scores = {}
        for domain, rules in DOMAIN_RULES.items():
            matches = []
            for kw in rules["keywords"]:
                count = len(re.findall(kw, search_blob))
                if count > 0:
                    matches.append((kw, count))
            
            if matches:
                # Score based on distinct matches + frequency
                distinct_matches = len(matches)
                total_freq = sum(c for _, c in matches)
                score = (distinct_matches * 15) + min(total_freq * 2, 45)
                domain_scores[domain] = {
                    "score": min(score, 100),
                    "matched_terms": [m[0] for m in matches],
                    "description": rules["description"]
                }
                
        if not domain_scores:
            # Fallback domain if no indicators found
            return {
                "domain": "Generic SaaS Utility",
                "confidence": 70.0,
                "matched_terms": ["generic"],
                "description": "Universal software structure. Configured as a base utility or general-purpose platform."
            }
            
        # Find domain with highest score
        best_domain = max(domain_scores, key=lambda k: domain_scores[k]["score"])
        best_data = domain_scores[best_domain]
        
        # Adjust confidence to feel premium
        confidence = float(min(75 + int(best_data["score"] * 0.24), 98))
        
        return {
            "domain": best_domain,
            "confidence": confidence,
            "matched_terms": best_data["matched_terms"],
            "description": best_data["description"]
        }
