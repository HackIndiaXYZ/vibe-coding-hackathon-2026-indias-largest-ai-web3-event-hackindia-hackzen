from typing import Dict, List, Any
import re

MODULE_RULES = {
    "Authentication": {
        "keywords": [r"\blogin\b", r"\bsignup\b", r"\bregister\b", r"\bauth\b", r"\bjwt\b", r"\btoken\b", r"\bpassword\b", r"\bpassport\b", r"\boauth\b"],
        "description": "User login, registration, and session control systems.",
        "features": ["Password Hashing", "JWT Generation", "User Sign-up Flow"]
    },
    "Authorization": {
        "keywords": [r"\brbac\b", r"\bpermission\b", r"\brole\b", r"\bscopes\b", r"\bpolicy\b", r"\bauthorize\b", r"\bis_admin\b", r"\bguard\b"],
        "description": "Role-based access control and action validation permissions.",
        "features": ["Role Mapping", "Access Guards", "Resource Permissions"]
    },
    "Billing & Payments": {
        "keywords": [r"\bstripe\b", r"\bpaypal\b", r"\binvoice\b", r"\bbilling\b", r"\bsubscription\b", r"\bcheckout\b", r"\bpricing\b", r"\bpayment\b", r"\btransaction\b"],
        "description": "Subscription handling, pricing tables, and checkout gateways.",
        "features": ["Payment Gateway Integrations", "Invoice Generation", "Subcription Management"]
    },
    "Notifications": {
        "keywords": [r"\bemail\b", r"\bsms\b", r"\bnotification\b", r"\bsend_mail\b", r"\btwilio\b", r"\bnodemailer\b", r"\bsendgrid\b", r"\bpush\b", r"\bmail\b"],
        "description": "Dispatches alerts, system notifications, or transactional emails.",
        "features": ["Transactional Emailing", "SMS Alerts", "Web Push Notifications"]
    },
    "Analytics & Dashboards": {
        "keywords": [r"\banalytics\b", r"\btracking\b", r"\bmixpanel\b", r"\bsegment\b", r"\blog_event\b", r"\bchart\b", r"\bmetric\b", r"\bdashboard\b"],
        "description": "Visual aggregates, user metrics, and operational charting.",
        "features": ["Activity Logging", "Metric Summarization", "Data Visualizations"]
    },
    "Reporting Engine": {
        "keywords": [r"\breport\b", r"\bexport\b", r"\bpdf\b", r"\bexcel\b", r"\bcsv\b", r"\bxlsx\b", r"\breportlab\b", r"\bdownload_report\b"],
        "description": "Formats, generates, and processes downloadable data reports.",
        "features": ["PDF Exporters", "CSV/Spreadsheet generation", "Data Aggregations"]
    },
    "Customer Relationship Management (CRM)": {
        "keywords": [r"\bcustomer\b", r"\blead\b", r"\bcontact\b", r"\bcrm\b", r"\bdeal\b", r"\binteraction\b", r"\bopportunity\b"],
        "description": "Tracks target customer touchpoints and sales pipelines.",
        "features": ["Lead Tracking", "Contact Histories", "Account Overviews"]
    },
    "User & Workspace Management": {
        "keywords": [r"\buser\b", r"\bprofile\b", r"\bmember\b", r"\bworkspace\b", r"\bteam\b", r"\baccount\b", r"\borg\b", r"\borganization\b"],
        "description": "User profiles, avatars, team setup, and workspace invites.",
        "features": ["Profile Modification", "Team Organization", "Workspace Provisioning"]
    }
}

class ModuleDetector:
    @staticmethod
    def detect_modules(scanner_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        parsed_data = scanner_results.get("parsed_data", {})
        
        # Combine all strings for token search
        functions_str = " ".join(parsed_data.get("functions", []))
        classes_str = " ".join(parsed_data.get("classes", []))
        imports_str = " ".join(parsed_data.get("imports", []))
        
        # Routes string representation
        routes_list = [r.get("path", "") + " " + r.get("handler", "") for r in parsed_data.get("routes", [])]
        routes_str = " ".join(routes_list)
        
        # Files string representation
        files_str = " ".join([f.get("path", "") for f in parsed_data.get("raw_files", [])])
        
        # Full content bag of words
        search_blob = (functions_str + " " + classes_str + " " + imports_str + 
                       " " + routes_str + " " + files_str).lower()

        detected_modules = []
        
        for module_name, rules in MODULE_RULES.items():
            matched_keywords = []
            confidence_score = 0
            
            for keyword in rules["keywords"]:
                if re.search(keyword, search_blob):
                    matched_keywords.append(keyword.replace(r"\b", ""))
            
            # If we matched at least 1 keyword or indicator
            if matched_keywords:
                # Calculate simple mock confidence based on match count
                match_count = len(matched_keywords)
                total_keywords = len(rules["keywords"])
                confidence = min(40 + int((match_count / total_keywords) * 60), 98)
                
                # Check for files specifically associated
                matching_files = []
                for file_info in parsed_data.get("raw_files", []):
                    file_path_lower = file_info["path"].lower()
                    for keyword in rules["keywords"]:
                        kw_clean = keyword.replace(r"\b", "")
                        if kw_clean in file_path_lower:
                            matching_files.append(file_info["path"])
                            break
                            
                detected_modules.append({
                    "name": module_name,
                    "confidence": confidence,
                    "matched_indicators": matched_keywords,
                    "description": rules["description"],
                    "features": rules["features"],
                    "files": matching_files[:5] # limit to top 5 files
                })
                
        # Default fallback modules if none detected
        if not detected_modules:
            detected_modules.append({
                "name": "User & Workspace Management",
                "confidence": 75,
                "matched_indicators": ["user", "settings"],
                "description": "User profiles, settings, and workspace details.",
                "features": ["Profile Configuration"],
                "files": []
            })
            
        return detected_modules
