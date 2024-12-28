# Generated by Django 4.2.7 on 2024-12-28 13:54

import api.models
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
            ],
        ),
        migrations.RemoveField(
            model_name='statistic',
            name='match',
        ),
        migrations.RemoveField(
            model_name='statistic',
            name='user',
        ),
        migrations.AddField(
            model_name='match',
            name='tournament_id',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AddField(
            model_name='statistic',
            name='match_id',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AddField(
            model_name='statistic',
            name='user_id',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to=api.models.avatar_upload_path),
        ),
        migrations.CreateModel(
            name='Friend',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('friend', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='friends_friend', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='friends_owner', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'friend')},
            },
        ),
    ]
