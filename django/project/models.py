#creating models that will then been created into tables

from django.db import models

class Player(models.Model):
	email = models.EmailField(max_length=200, unique=True, primary_key = True)
	password = models.CharField(max_length=200)
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)

	class Meta:
		db_table = 'player'

class Room(models.Model):
	room_id = models.AutoField(primary_key=True)
	player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player1')
	player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player2')
	turn = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='turn')
	#board = models.CharField(max_length=9, default='---------')
	winner = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='winner', null=True, blank=True)

	class Meta:
		db_table = 'room'