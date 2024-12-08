from rest_framework import serializers
from .models import User, Match, Statistic, Friend

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = '__all__'

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = '__all__'

class StatisticSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statistic
        fields = '__all__'

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