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
    tournamentId = serializers.IntegerField(write_only=True, allow_null=True)  # ID for writable purposes
    datetimeStart = serializers.DateTimeField(source='datetime_start')
    datetimeEnd = serializers.DateTimeField(source='datetime_end')
    prematureEnd = serializers.BooleanField(source='premature_end')

    class Meta:
        model = Match
        fields = ['id', 'datetimeStart', 'datetimeEnd', 'tournamentId', 'prematureEnd']

    def create(self, validated_data):
        # Handle the tournamentId explicitly
        tournament_id = validated_data.pop('tournamentId', None)
        if tournament_id:
            validated_data['tournament'] = Tournament.objects.get(id=tournament_id)
        return Match.objects.create(**validated_data)


class StatisticSerializer(serializers.ModelSerializer):
    matchId = serializers.IntegerField(write_only=True, source='match.id')  # Match ID for writable purposes
    userId = serializers.IntegerField(write_only=True, source='user.id')   # User ID for writable purposes
    goalsScored = serializers.IntegerField(source='goals_scored', min_value=0)
    goalsReceived = serializers.IntegerField(source='goals_received', min_value=0)
    datetimeLeft = serializers.DateTimeField(source='datetime_left')
    won = serializers.BooleanField(default=False)

    class Meta:
        model = Statistic
        fields = ['id', 'goalsScored', 'goalsReceived', 'datetimeLeft', 'won', 'matchId', 'userId']

    def create(self, validated_data):
        # Handle match and user relationships
        match_id = validated_data.pop('match')['id']
        user_id = validated_data.pop('user')['id']
        validated_data['match'] = Match.objects.get(id=match_id)
        validated_data['user'] = User.objects.get(id=user_id)
        return Statistic.objects.create(**validated_data)


class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['id']  # Only need the tournament ID


class UserMatchStatisticsSerializer(serializers.Serializer):
    tournamentId = serializers.IntegerField(allow_null=True)
    matches = MatchSerializer(many=True)

    class Meta:
        fields = ['tournamentId', 'matches']


class FriendSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()

    class Meta:
        model = Friend
        fields = ['id', 'friend', 'created_at']

    def get_friend(self,obj):
        return {
            "tid": obj.friend.id,
            "username": obj.friend.username,
            "status": obj.friend.status,
            "last_online": obj.friend.last_online,
        }