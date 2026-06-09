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
        self.assertIn("Progress & streaks", html)
        self.assertIn("Start", html)
        self.assertIn("Stop", html)
        self.assertIn("Resume", html)
        self.assertIn("Reset", html)
        self.assertIn("id=\"timerDisplay\"", html)
        self.assertIn("id=\"workMinutesInput\"", html)
        self.assertIn("id=\"shortBreakMinutesInput\"", html)
        self.assertIn("id=\"longBreakMinutesInput\"", html)
        self.assertIn("id=\"roundsBeforeLongBreakInput\"", html)
        self.assertIn("Save settings", html)
        self.assertIn("id=\"xpSummary\"", html)
        self.assertIn("id=\"levelSummary\"", html)
        self.assertIn("id=\"streakSummary\"", html)
        self.assertIn("id=\"badgeList\"", html)
        self.assertIn("id=\"weeklyCompletionRate\"", html)
        self.assertIn("id=\"monthlyCompletionRate\"", html)
        self.assertIn("id=\"weeklyAverageFocus\"", html)
        self.assertIn("id=\"monthlyAverageFocus\"", html)

    def test_index_page_includes_static_assets(self):
        response = self.client.get("/")
        html = response.get_data(as_text=True)

        self.assertIn("/static/css/style.css", html)
        self.assertIn("/static/js/app.js", html)


if __name__ == "__main__":
    unittest.main()