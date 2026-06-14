from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('portfolio', '0005_rename_video_file_portfolio_video'),
    ]

    operations = [
        migrations.AddField(
            model_name='portfolio',
            name='tagline',
            field=models.CharField(blank=True, max_length=200, help_text='Short one-liner shown on cards'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='available_date',
            field=models.DateField(blank=True, null=True, help_text='Launch / availability date'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='android',
            field=models.BooleanField(default=False, verbose_name='Android (Google Play)'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='ios',
            field=models.BooleanField(default=False, verbose_name='iOS (App Store)'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='meta_quest',
            field=models.BooleanField(default=False, verbose_name='Meta Quest'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='web_app',
            field=models.BooleanField(default=False, verbose_name='Web / WebAR'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='google_play_url',
            field=models.URLField(blank=True, verbose_name='Google Play URL'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='app_store_url',
            field=models.URLField(blank=True, verbose_name='App Store URL'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='meta_store_url',
            field=models.URLField(blank=True, verbose_name='Meta Quest Store URL'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='web_app_url',
            field=models.URLField(blank=True, verbose_name='Web App URL'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='downloads_count',
            field=models.CharField(blank=True, max_length=20, help_text='e.g. 10K+, 1M+'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='rating',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=3, null=True, help_text='Rating out of 5'),
        ),
        migrations.AddField(
            model_name='portfolio',
            name='features',
            field=models.TextField(blank=True, help_text='Key features — one per line'),
        ),
        migrations.AlterField(
            model_name='portfolio',
            name='status',
            field=models.CharField(
                choices=[('Available', 'Available'), ('Beta', 'Beta'), ('Coming Soon', 'Coming Soon')],
                default='Available',
                max_length=20,
            ),
        ),
    ]
