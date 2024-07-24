#creating models that will then been created into tables

from django.db import models

class Player(models.Model):
	email = models.EmailField(max_length=200, unique=True)
	password = models.CharField(max_length=200)
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)

	class Meta:
		db_table = 'player'