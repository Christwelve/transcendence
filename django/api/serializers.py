from rest_framework import serializers
from .models import User, Match, Statistic, Friend, Tournament

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = '__all__'

    def create(self, validated_data):
        validated_data['is_active'] = True
        return super().create(validated_data)

class MatchSerializer(serializers.ModelSerializer):
    tournamentId = serializers.IntegerField(source='tournament_id', min_value=0, allow_null=True)
    datetimeStart = serializers.DateTimeField(source='datetime_start')
    datetimeEnd = serializers.DateTimeField(source='datetime_end')
    prematureEnd = serializers.BooleanField(source='premature_end')

    class Meta:
        model = Match
        fields = ['id', 'datetimeStart', 'datetimeEnd', 'tournamentId', 'prematureEnd']

class StatisticSerializer(serializers.ModelSerializer):
    matchId = serializers.IntegerField(source='match_id', min_value=0)
    userId = serializers.IntegerField(source='user_id', min_value=0)
    goalsScored = serializers.IntegerField(source='goals_scored', min_value=0)
    goalsReceived = serializers.IntegerField(source='goals_received', min_value=0)
    datetimeLeft = serializers.DateTimeField(source='datetime_left')

    class Meta:
        model = Statistic
        fields = ['id', 'goalsScored', 'goalsReceived', 'datetimeLeft', 'matchId', 'userId']

class TournamentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tournament
        fields = ['id']


class FriendSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()

    class Meta:
        model = Friend
        fields = ['id', 'friend', 'created_at']

    def get_friend(self,obj):
        return {
            "username": obj.friend.username,
            "status": obj.friend.status,
            "last_online": obj.friend.last_online,
        }