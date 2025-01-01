# Generated by Django 4.2.7 on 2025-01-01 14:47

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='match',
            name='tournament_id',
        ),
        migrations.RemoveField(
            model_name='statistic',
            name='match_id',
        ),
        migrations.RemoveField(
            model_name='statistic',
            name='user_id',
        ),
        migrations.AddField(
            model_name='match',
            name='premature_end',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='match',
            name='tournament',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.tournament'),
        ),
        migrations.AddField(
            model_name='statistic',
            name='match',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='api.match'),
        ),
        migrations.AddField(
            model_name='statistic',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='user',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='avatars/'),
        ),
    ]
