from typing import Dict, List, Any

DOMAIN_API_TEMPLATES = {
    "Healthcare": [
        {"path": "/api/auth/register", "method": "POST", "handler": "auth_controller.register", "description": "Registers new patients and staff roles."},
        {"path": "/api/auth/login", "method": "POST", "handler": "auth_controller.login", "description": "Authenticates users and issues JWT authorization tokens."},
        {"path": "/api/patients", "method": "GET", "handler": "patient_controller.list", "description": "Fetches searchable registries of clinic patients."},
        {"path": "/api/patients", "method": "POST", "handler": "patient_controller.create", "description": "Enrolls a new patient and creates clinical files."},
        {"path": "/api/appointments", "method": "POST", "handler": "appointment_controller.schedule", "description": "Schedules medical checkups with specific doctors."},
        {"path": "/api/appointments", "method": "GET", "handler": "appointment_controller.list", "description": "Lists appointments, filtered by department or date."},
        {"path": "/api/prescriptions", "method": "POST", "handler": "prescription_controller.issue", "description": "Issues dynamic medical drug prescriptions."},
        {"path": "/api/billing/invoice", "method": "POST", "handler": "billing_controller.charge", "description": "Generates patient billing invoices for insurance claims."}
    ],
    "Education": [
        {"path": "/api/auth/login", "method": "POST", "handler": "auth.login", "description": "Teacher/student login credentials exchange."},
        {"path": "/api/courses", "method": "GET", "handler": "course.list", "description": "Lists registered curriculum directories."},
        {"path": "/api/courses", "method": "POST", "handler": "course.create", "description": "Allows instructors to set up course modules."},
        {"path": "/api/enrollment", "method": "POST", "handler": "enroll.student", "description": "Enrolls a student in a target class section."},
        {"path": "/api/assignments", "method": "POST", "handler": "assignment.publish", "description": "Publishes a new quiz or homework assignment."},
        {"path": "/api/submissions", "method": "POST", "handler": "grade.submit", "description": "Accepts homework deliverables from students."},
        {"path": "/api/grades", "method": "GET", "handler": "grade.report", "description": "Aggregates report cards for specific students."}
    ],
    "Finance & Banking": [
        {"path": "/api/auth/login", "method": "POST", "handler": "auth.login", "description": "Secure financial customer authentication."},
        {"path": "/api/accounts", "method": "GET", "handler": "account.balances", "description": "Retrieves active debit/savings balances."},
        {"path": "/api/transactions", "method": "POST", "handler": "tx.transfer", "description": "Executes standard bank wire transfer."},
        {"path": "/api/cards", "method": "GET", "handler": "card.list", "description": "Lists linked credit cards and statuses."},
        {"path": "/api/loans/apply", "method": "POST", "handler": "loan.request", "description": "Requests business credit or personal loans."}
    ],
    "E-Commerce & Retail": [
        {"path": "/api/products", "method": "GET", "handler": "product.list", "description": "Fetches active product inventory lists."},
        {"path": "/api/cart", "method": "POST", "handler": "cart.add", "description": "Adds a product item to user's shopping cart."},
        {"path": "/api/checkout", "method": "POST", "handler": "checkout.process", "description": "Validates pricing tiers and charges cards."},
        {"path": "/api/orders", "method": "GET", "handler": "order.history", "description": "Lists user orders and tracking status."}
    ],
    "Generic Utility": [
        {"path": "/api/auth/login", "method": "POST", "handler": "auth.login", "description": "Standard login handler."},
        {"path": "/api/users/profile", "method": "GET", "handler": "user.profile", "description": "Fetches current account information."},
        {"path": "/api/settings", "method": "PUT", "handler": "settings.update", "description": "Updates workspace configurations."},
        {"path": "/api/health", "method": "GET", "handler": "sys.health", "description": "Server health status monitor."}
    ]
}

class APIExtractor:
    @staticmethod
    def extract_apis(scanner_results: Dict[str, Any], domain: str) -> List[Dict[str, Any]]:
        parsed_data = scanner_results.get("parsed_data", {})
        discovered_routes = parsed_data.get("routes", [])

        # If we have actual routes scanned, use them!
        extracted_apis = []
        for route in discovered_routes:
            path = route.get("path", "")
            method = route.get("method", "GET")
            handler = route.get("handler", "")
            
            # Guess description based on path
            desc = f"API route handling requests to {path}."
            if "login" in path:
                desc = "Exchanges credentials for secure JWT access token."
            elif "register" in path or "signup" in path:
                desc = "Registers and provisions a new account."
            elif "user" in path:
                desc = "Manages user and profile details."
            elif "setting" in path:
                desc = "Manages system config parameters."

            extracted_apis.append({
                "path": path,
                "method": method,
                "handler": handler or "router.endpoint",
                "description": desc
            })

        # If less than 3 routes found, fill/back up with domain specific API opportunities
        if len(extracted_apis) < 3:
            clean_domain = domain if domain in DOMAIN_API_TEMPLATES else "Generic Utility"
            if clean_domain not in DOMAIN_API_TEMPLATES:
                # search for partial match
                matched = False
                for k in DOMAIN_API_TEMPLATES.keys():
                    if k.split()[0] in domain:
                        clean_domain = k
                        matched = True
                        break
                if not matched:
                    clean_domain = "Generic Utility"
            
            # Merge template routes with any custom found ones
            seen = {r["path"] for r in extracted_apis}
            for template in DOMAIN_API_TEMPLATES[clean_domain]:
                if template["path"] not in seen:
                    extracted_apis.append(template)

        return extracted_apis
