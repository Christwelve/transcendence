from django.test import TestCase
from .models import User, Match, Statistic
from datetime import datetime

class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username="testuser",
            email="testuser@example.com",
            password="securepassword",
            wins=5,
            losses=3,
        )

    def test_user_creation(self):
        self.assertEqual(self.user.username, "testuser")
        self.assertEqual(self.user.email, "testuser@example.com")
        self.assertEqual(self.user.wins, 5)
        self.assertEqual(self.user.losses, 3)
        self.assertTrue(self.user.status)  # Default is True

    def test_user_str(self):
        self.assertEqual(str(self.user), f"User {self.user.id}: testuser")


class MatchModelTest(TestCase):
    def setUp(self):
        self.match = Match.objects.create(
            datetime_start=datetime(2024, 10, 21, 17, 26, 32),
            datetime_end=datetime(2024, 10, 21, 18, 26, 32),
        )

    def test_match_creation(self):
        self.assertEqual(self.match.datetime_start, datetime(2024, 10, 21, 17, 26, 32))
        self.assertEqual(self.match.datetime_end, datetime(2024, 10, 21, 18, 26, 32))

    def test_match_str(self):
        self.assertEqual(
            str(self.match),
            f"Match {self.match.id} ({self.match.datetime_start} - {self.match.datetime_end})",
        )


class StatisticModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username="testuser",
            email="testuser@example.com",
            password="securepassword",
        )
        self.match = Match.objects.create(
            datetime_start=datetime(2024, 10, 21, 17, 26, 32),
            datetime_end=datetime(2024, 10, 21, 18, 26, 32),
        )
        self.statistic = Statistic.objects.create(
            match=self.match,
            user=self.user,
            goals_scored=7,
            goals_received=3,
            datetime_left=datetime(2024, 10, 21, 18, 0, 0),
        )

    def test_statistic_creation(self):
        self.assertEqual(self.statistic.match, self.match)
        self.assertEqual(self.statistic.user, self.user)
        self.assertEqual(self.statistic.goals_scored, 7)
        self.assertEqual(self.statistic.goals_received, 3)
        self.assertEqual(self.statistic.datetime_left, datetime(2024, 10, 21, 18, 0, 0))

    def test_statistic_str(self):
        self.assertEqual(
            str(self.statistic),
            f"Statistic {self.statistic.id}: Match {self.match.id}, User {self.user.username}",
        )

