"""
test_gemini.py
Unit tests for backend Gemini client and parallel recommendation engine.
"""
import unittest
from unittest.mock import patch, MagicMock
import time

from backend import gemini_client
from backend.saas_recommender import SaaSRecommender


class TestGeminiClientAndRecommender(unittest.TestCase):

    def setUp(self):
        # Clear cache before each test
        gemini_client._cache.clear()
        # Backup API Key
        self.original_api_key = gemini_client._API_KEY
        gemini_client._API_KEY = "test_api_key_123"

    def tearDown(self):
        # Restore API Key
        gemini_client._API_KEY = self.original_api_key

    def test_cache_mechanism(self):
        prompt = "test_prompt"
        model_alias = "flash"
        data = {"recommended_product": "CachedProduct", "source": "ai"}

        # Cache is initially empty
        self.assertIsNone(gemini_client._get_cached(prompt, model_alias))

        # Set cache
        gemini_client._set_cached(prompt, model_alias, data)

        # Get cache should return data with cached=True
        cached = gemini_client._get_cached(prompt, model_alias)
        self.assertIsNotNone(cached)
        self.assertEqual(cached["recommended_product"], "CachedProduct")

        # Test TTL expiration (manually modifying cache timestamp to simulate expiry)
        key = gemini_client._make_key(prompt, model_alias)
        gemini_client._cache[key]["ts"] = time.time() - (gemini_client._CACHE_TTL + 10)

        # Cache should now be expired and return None
        self.assertIsNone(gemini_client._get_cached(prompt, model_alias))

    @patch("google.generativeai.GenerativeModel")
    def test_get_ai_recommendation_success(self, mock_generative_model):
        # Setup mock response
        mock_model_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"recommended_product": "AI Product Pro", "product_type": "SaaS Product", "explanation": "Works fine."}'
        mock_model_instance.generate_content.return_value = mock_response
        mock_generative_model.return_value = mock_model_instance

        scan_results = {"file_count": 10, "folder_count": 2, "languages": {"Python": 100}}
        modules = [{"name": "Auth"}]
        domain_info = {"domain": "Security", "confidence": 95}
        score_info = {"overall_score": 85}

        result = gemini_client.get_ai_recommendation(
            scan_results, modules, domain_info, score_info, model_alias="flash"
        )

        self.assertIn("recommended_product", result)
        self.assertEqual(result["recommended_product"], "AI Product Pro")
        self.assertEqual(result["source"], "ai")
        self.assertFalse(result["cached"])

        # Run again to verify cache hit
        result_cached = gemini_client.get_ai_recommendation(
            scan_results, modules, domain_info, score_info, model_alias="flash"
        )
        self.assertTrue(result_cached["cached"])
        self.assertEqual(result_cached["recommended_product"], "AI Product Pro")

    def test_get_ai_recommendation_missing_key(self):
        gemini_client._API_KEY = ""
        scan_results = {}
        modules = []
        domain_info = {}
        score_info = {}

        result = gemini_client.get_ai_recommendation(
            scan_results, modules, domain_info, score_info, model_alias="flash"
        )
        self.assertIn("error", result)
        self.assertEqual(result["error"], "GEMINI_API_KEY not configured on the server.")

    @patch("google.generativeai.GenerativeModel")
    def test_get_ai_recommendation_invalid_json(self, mock_generative_model):
        mock_model_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.text = 'invalid json response'
        mock_model_instance.generate_content.return_value = mock_response
        mock_generative_model.return_value = mock_model_instance

        scan_results = {}
        modules = []
        domain_info = {}
        score_info = {}

        result = gemini_client.get_ai_recommendation(
            scan_results, modules, domain_info, score_info, model_alias="flash"
        )
        self.assertIn("error", result)
        self.assertTrue(result["error"].startswith("AI returned non-JSON response"))

    @patch("google.generativeai.GenerativeModel")
    def test_get_ai_recommendation_api_exception(self, mock_generative_model):
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.side_effect = Exception("API connection error")
        mock_generative_model.return_value = mock_model_instance

        scan_results = {}
        modules = []
        domain_info = {}
        score_info = {}

        result = gemini_client.get_ai_recommendation(
            scan_results, modules, domain_info, score_info, model_alias="flash"
        )
        self.assertIn("error", result)
        self.assertEqual(result["error"], "API connection error")

    @patch("google.generativeai.GenerativeModel")
    def test_parallel_recommender(self, mock_generative_model):
        mock_model_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"recommended_product": "AI Product Pro", "product_type": "SaaS Product", "explanation": "Works fine."}'
        mock_model_instance.generate_content.return_value = mock_response
        mock_generative_model.return_value = mock_model_instance

        scan_results = {"file_count": 10, "folder_count": 2, "languages": {"Python": 100}, "parsed_data": {"routes": []}}
        modules = [{"name": "Auth"}]
        domain_info = {"domain": "Security", "confidence": 95}
        score_info = {"overall_score": 85}

        combined = SaaSRecommender.recommend(
            scan_results, modules, domain_info, score_info, model_alias="flash"
        )

        self.assertIn("heuristic", combined)
        self.assertIn("ai", combined)
        self.assertEqual(combined["preferred"], "ai")
        self.assertEqual(combined["ai"]["recommended_product"], "AI Product Pro")
        self.assertEqual(combined["heuristic"]["product_type"], "Enterprise Software")

    @patch("zipfile.ZipFile")
    @patch("zipfile.is_zipfile", return_value=True)
    @patch("os.makedirs")
    @patch("os.listdir", return_value=["projectToproduct"])
    @patch("os.path.isdir", return_value=True)
    def test_zip_filtering(self, mock_isdir, mock_listdir, mock_makedirs, mock_is_zipfile, mock_zipfile_class):
        from backend.upload_service import UploadService
        
        mock_zip_instance = MagicMock()
        mock_zip_instance.namelist.return_value = [
            "projectToproduct/main.py",
            "projectToproduct/node_modules/express/index.js",
            "projectToproduct/venv/bin/activate",
            "projectToproduct/frontend/src/App.tsx",
        ]
        mock_zipfile_class.return_value.__enter__.return_value = mock_zip_instance

        result = UploadService.extract_zip("dummy.zip", "extracted_dir")

        expected_members = [
            "projectToproduct/main.py",
            "projectToproduct/frontend/src/App.tsx"
        ]
        mock_zip_instance.extractall.assert_called_once_with("extracted_dir", members=expected_members)


if __name__ == "__main__":
    unittest.main()
