import sys
from pathlib import Path
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


from app import app


class PomodoroAppTestCase(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_index_route_returns_success(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.content_type)

    def test_index_page_contains_main_sections(self):
        response = self.client.get("/")
        html = response.get_data(as_text=True)

        self.assertIn("Pomodoro Timer", html)
        self.assertIn("Focus on what matters", html)
        self.assertIn("Work Session", html)
        self.assertIn("Timer configuration", html)
        self.assertIn("Start", html)
        self.assertIn("Stop", html)
        self.assertIn("Resume", html)
        self.assertIn("Reset", html)
        self.assertIn("id=\"timerDisplay\"", html)
        self.assertIn("id=\"workMinutesInput\"", html)
        self.assertIn("id=\"breakMinutesInput\"", html)
        self.assertIn("id=\"themeModeInput\"", html)
        self.assertIn("id=\"startSoundInput\"", html)
        self.assertIn("id=\"endSoundInput\"", html)
        self.assertIn("id=\"tickSoundInput\"", html)
        self.assertIn("Save settings", html)

    def test_index_page_contains_customization_options(self):
        response = self.client.get("/")
        html = response.get_data(as_text=True)

        self.assertIn(">15 min<", html)
        self.assertIn(">25 min<", html)
        self.assertIn(">35 min<", html)
        self.assertIn(">45 min<", html)
        self.assertIn(">5 min<", html)
        self.assertIn(">10 min<", html)
        self.assertIn(">15 min<", html)
        self.assertIn(">Light<", html)
        self.assertIn(">Dark<", html)
        self.assertIn(">Focus<", html)
        self.assertIn("Start sound", html)
        self.assertIn("End sound", html)
        self.assertIn("Tick sound", html)

    def test_index_page_includes_static_assets(self):
        response = self.client.get("/")
        html = response.get_data(as_text=True)

        self.assertIn("/static/css/style.css", html)
        self.assertIn("/static/js/app.js", html)


if __name__ == "__main__":
    unittest.main()