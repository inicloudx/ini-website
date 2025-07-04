# Generated by Django 5.1.3 on 2025-06-21 09:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='portfolio',
            name='partnership_details',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='show_direct_purchase',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='usage',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='portfolio',
            name='description',
            field=models.TextField(max_length=250),
        ),
    ]
