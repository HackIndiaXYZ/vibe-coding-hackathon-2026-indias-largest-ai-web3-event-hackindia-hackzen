from typing import Dict, List, Any

DOMAIN_BUSINESS_TEMPLATES = {
    "Healthcare": {
        "target_market": "Hospitals, Private Practices, and Digital Health Startups.",
        "potential_customers": "Outpatient clinics, regional hospitals, specialized practitioners, telehealth software operators.",
        "estimated_market_size": "$350B Global Digital Health Market",
        "monetization": "Per-provider monthly subscriptions (SaaS), payment transaction fees (1-2%), or enterprise self-hosted licensing.",
        "selling_points": [
            "HIPAA-compliant patient record architecture.",
            "Automated scheduling reduces staff coordination overhead by 30%.",
            "Extensible API for connecting to custom diagnostic systems."
        ],
        "business_potential": "High"
    },
    "Education": {
        "target_market": "K-12 Schools, Academic Universities, and Corporate Learning Centers.",
        "potential_customers": "Charter schools, code bootcamps, online course authors, employee training agencies.",
        "estimated_market_size": "$280B Global EdTech Market",
        "monetization": "Per-student monthly active licenses, premium content course-split fees, or school-district broad contracts.",
        "selling_points": [
            "Modular syllabus pacing structure.",
            "Online submissions and interactive grading pipelines minimize grading times.",
            "Teacher-parent communication and enrollment automation."
        ],
        "business_potential": "Medium to High"
    },
    "Finance & Banking": {
        "target_market": "FinTech startups, Microfinance agencies, and Neo-banks.",
        "potential_customers": "Local credit unions, personal budget startups, retail payment facilitators.",
        "estimated_market_size": "$620B Global FinTech Market",
        "monetization": "Per-transaction micro-fees, credit screening api charges, or white-labeled banking ledger licenses.",
        "selling_points": [
            "Sleek transaction ledger architecture.",
            "Extensible cards and wallets model API.",
            "Instant micro-transfer routing interfaces."
        ],
        "business_potential": "High"
    },
    "E-Commerce & Retail": {
        "target_market": "Online Merchants, Direct-To-Consumer (D2C) brands, and Warehouse distributors.",
        "potential_customers": "Boutique Shopify sellers, multi-channel wholesalers, niche e-commerce founders.",
        "estimated_market_size": "$5.7T Global Retail E-commerce Market",
        "monetization": "Per-transaction checkout revenue share, monthly inventory sync limits, or custom theme licensing.",
        "selling_points": [
            "Superfast, headless catalog loading.",
            "Automated multi-warehouse stock decrementing.",
            "Integrates stripe checkout workflows instantly out of the box."
        ],
        "business_potential": "High"
    },
    "Logistics & Inventory": {
        "target_market": "Supply chain operators, Freight forwarders, and Delivery networks.",
        "potential_customers": "Third-party logistics (3PL) providers, local courier fleets, small wholesale warehouses.",
        "estimated_market_size": "$12.8T Global Logistics Market",
        "monetization": "Per-vehicle active tracker routing licenses, monthly order dispatch caps, or enterprise fleet systems.",
        "selling_points": [
            "Optimized courier dispatch pipelines.",
            "Live package tracking updates and API hooks.",
            "Structured inventory warehouse space management systems."
        ],
        "business_potential": "Medium"
    },
    "Human Resources": {
        "target_market": "Mid-sized SMBs, Professional recruitment agencies, and Staffing providers.",
        "potential_customers": "Growth startups (50-500 employees), contract hiring firms, payroll consulting firms.",
        "estimated_market_size": "$38B Global HR Tech Market",
        "monetization": "Per-employee seat licenses, recruiter pipeline tracking fees, or flat-rate payroll engine access.",
        "selling_points": [
            "Centralized timesheet and vacation approval queues.",
            "Recruiter pipeline and candidate scoring profiles.",
            "Secure corporate payroll ledgers."
        ],
        "business_potential": "Medium"
    },
    "Generic SaaS Utility": {
        "target_market": "Indie hackers, developer agencies, and digital product studios.",
        "potential_customers": "Solopreneurs, internal development groups, project architects.",
        "estimated_market_size": "$190B Global Developer Tools Market",
        "monetization": "Open-source core with paid hosting options, API key usage limits, or custom extension licenses.",
        "selling_points": [
            "Extremely clean, modern stack scaffolding.",
            "Instant JWT session setups.",
            "Interactive configuration dashboard UI."
        ],
        "business_potential": "Medium"
    }
}

class BusinessOpportunityEngine:
    @staticmethod
    def analyze(domain: str, overall_score: int) -> Dict[str, Any]:
        # Try to resolve domain key
        domain_key = "Generic SaaS Utility"
        for k in DOMAIN_BUSINESS_TEMPLATES.keys():
            if k.split()[0] in domain:
                domain_key = k
                break
                
        template = DOMAIN_BUSINESS_TEMPLATES[domain_key]
        
        # Adjust potential based on code quality/score
        pot = template["business_potential"]
        if overall_score < 55:
            pot = "Medium"
        elif overall_score < 40:
            pot = "Low"

        return {
            "target_market": template["target_market"],
            "potential_customers": template["potential_customers"],
            "estimated_market_size": template["estimated_market_size"],
            "monetization": template["monetization"],
            "key_selling_points": template["selling_points"],
            "business_potential": pot,
            "rationale": f"The project's architectural structure is strong enough to address these markets directly with minor enhancements. Target monetization fits modern subscription frameworks."
        }
