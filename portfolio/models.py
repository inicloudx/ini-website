from django.db import models

class Portfolio(models.Model):
    CATEGORY_CHOICES = [
        ('AR', 'Augmented Reality'),
        ('VR', 'Virtual Reality'),
        ('XR', 'Extended Reality'),
    ]

    STATUS_CHOICES = [
        ('Beta', 'Beta'),
        ('Production', 'Production'),
        ('Coming Soon', 'Coming Soon'),
    ]

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    youtube_link = models.URLField(blank=True, null=True)
    amazon_link = models.URLField(blank=True, null=True)
    flipkart_link = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Production')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
