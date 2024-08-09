from django import forms
from .models import Player
from django.contrib.auth.hashers import make_password

class PlayerRegistrationForm(forms.ModelForm):
	# Define any custom validation or fields if needed
	class Meta:
		model = Player
		fields = ['email', 'password']

	def save(self, commit=True):
		player = super().save(commit=False)
		# Hash the password before saving
		player.password = make_password(self.cleaned_data['password'])
		if commit:
			player.save()
		return player
