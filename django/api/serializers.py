from rest_framework import serializers
from .models import User, Match, Statistic, Friend

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = '__all__'

class MatchSerializer(serializers.ModelSerializer):
    matchType = serializers.CharField(source='match_type')
    startTime = serializers.DateTimeField(source='datetime_start')
    endTime = serializers.DateTimeField(source='datetime_end')

    class Meta:
        model = Match
        fields = ['id', 'startTime', 'endTime', 'matchType']

    def validate_matchType(self, value):
        if value not in [Match.SINGLE_GAME, Match.TOURNAMENT]:
            raise serializers.ValidationError("Invalid match type.")
        return value

class StatisticSerializer(serializers.ModelSerializer):
    matchId = serializers.IntegerField(source='match_id', min_value=0)
    userId = serializers.IntegerField(source='user_id', min_value=0)
    goalsScored = serializers.IntegerField(source='goals_scored', min_value=0)
    goalsReceived = serializers.IntegerField(source='goals_received', min_value=0)
    datetimeLeft = serializers.DateTimeField(source='datetime_left')

    class Meta:
        model = Statistic
        fields = ['id', 'goalsScored', 'goalsReceived', 'datetimeLeft', 'matchId', 'userId']

    def validate(self, attrs):
        # Debugging the incoming data
        print("Validating data:", attrs)
        return super().validate(attrs)



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