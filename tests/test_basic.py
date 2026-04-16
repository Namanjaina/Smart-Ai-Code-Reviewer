import unittest
import os
import django

# Provide minimal Django setup for any integration tests
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.config.settings")
django.setup()

class BasicProjectTest(unittest.TestCase):
    def test_environment_initialized(self):
        """Ensure the environment bootstraps correctly in CI"""
        self.assertTrue(True)
        
    def test_django_version(self):
        """Sanity check Django version binding"""
        self.assertIsNotNone(django.get_version())
