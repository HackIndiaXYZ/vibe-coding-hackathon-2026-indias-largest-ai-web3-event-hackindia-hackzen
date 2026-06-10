"""
saas_recommender.py
Runs the heuristic engine and the Gemini AI engine in parallel (using threads).
Returns both results so the frontend can display them side-by-side or let the
user pick a preferred source.
"""
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any

from . import gemini_client

logger = logging.getLogger(__name__)


class SaaSRecommender:

    # ------------------------------------------------------------------
    # Heuristic engine (original logic, unchanged)
    # ------------------------------------------------------------------
    @staticmethod
    def _heuristic_recommend(
        scanner_results: Dict[str, Any],
        detected_modules: List[Dict[str, Any]],
        domain_info: Dict[str, Any],
        score_info: Dict[str, Any],
    ) -> Dict[str, Any]:
        overall_score = score_info.get("overall_score", 50)
        domain = domain_info.get("domain", "Generic Utility")

        has_auth    = any(m["name"] == "Authentication" for m in detected_modules)
        has_billing = any("billing" in m["name"].lower() or "payment" in m["name"].lower() for m in detected_modules)
        route_count = len(scanner_results.get("parsed_data", {}).get("routes", []))

        if overall_score >= 80 and has_billing:
            product_type = "SaaS Product"
            explanation  = "Excellent modular structure combined with transaction models. Ready for multi-tenant subscription."
        elif overall_score >= 70 and route_count > 10:
            product_type = "API Product"
            explanation  = "Substantial backend route coverage. Reusable as an API-first microservice or headless service."
        elif overall_score >= 60:
            product_type = "Enterprise Software"
            explanation  = "Strong business logical cores. Suitable for on-premise installation or private cloud deployments."
        else:
            product_type = "Internal Developer Tool"
            explanation  = "Valuable utility features. Best deployed internally as an efficiency booster before scaling."

        clean_domain = domain.split("&")[0].strip()
        names = {
            "SaaS Product":           f"Cloud{clean_domain} Pro SaaS",
            "API Product":            f"{clean_domain}Core Engine API",
            "Enterprise Software":    f"{clean_domain}Suite Enterprise",
            "Internal Developer Tool": f"Local{clean_domain} Toolkit",
        }
        recommended_name = names[product_type]

        roadmap = [
            "Implement multi-tenant database partitioning to safely segregate customer records.",
            "Refactor current inline authorization blocks into standard Middleware guards.",
        ]
        if not has_auth:
            roadmap.insert(0, "Add OAuth2/JWT secure authentication layers to control endpoint accessibility.")
        if not has_billing:
            roadmap.append("Integrate billing gateways (e.g. Stripe checkout) for subscription and tier control.")
        else:
            roadmap.append("Add credit card usage analytics and automatic invoicing models.")
        roadmap.append("Set up Docker containers and CI/CD pipelines to build scalable cloud-native micro-clusters.")

        return {
            "recommended_product": recommended_name,
            "product_type":        product_type,
            "explanation":         explanation,
            "can_become_product":  "YES" if overall_score >= 50 else "NO",
            "roadmap":             roadmap,
            "reasons": [
                f"Matches {domain} indicators with {domain_info.get('confidence')}% confidence.",
                f"Scored {overall_score}/100 on product modularity and reusability.",
                f"Discovered {len(detected_modules)} core business modules in scanner.",
                f"Identified {route_count} functional endpoints ready for external access.",
            ],
            "source": "heuristic",
        }

    # ------------------------------------------------------------------
    # Public: parallel recommend
    # ------------------------------------------------------------------
    @staticmethod
    def recommend(
        scanner_results: Dict[str, Any],
        detected_modules: List[Dict[str, Any]],
        domain_info: Dict[str, Any],
        score_info: Dict[str, Any],
        model_alias: str = "flash",
    ) -> Dict[str, Any]:
        """
        Run heuristic and AI engines in parallel.
        Returns:
          {
            "heuristic": { ...heuristic result... },
            "ai":        { ...gemini result or error... },
            "preferred": "ai" | "heuristic"   # default preference
          }
        The frontend can let the user switch between the two.
        """
        heuristic_result: Dict[str, Any] = {}
        ai_result:        Dict[str, Any] = {}

        def run_heuristic():
            return SaaSRecommender._heuristic_recommend(
                scanner_results, detected_modules, domain_info, score_info
            )

        def run_ai():
            return gemini_client.get_ai_recommendation(
                scanner_results, detected_modules, domain_info, score_info,
                model_alias=model_alias,
            )

        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = {
                pool.submit(run_heuristic): "heuristic",
                pool.submit(run_ai):        "ai",
            }
            for future in as_completed(futures):
                label = futures[future]
                try:
                    result = future.result()
                except Exception as exc:
                    logger.error("Engine %s failed: %s", label, exc)
                    result = {"error": str(exc), "source": label}
                if label == "heuristic":
                    heuristic_result = result
                else:
                    ai_result = result

        # Prefer AI if it succeeded (no 'error' key), else fall back to heuristic
        preferred = "ai" if "error" not in ai_result else "heuristic"

        return {
            "heuristic": heuristic_result,
            "ai":        ai_result,
            "preferred": preferred,
        }
