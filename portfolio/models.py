import os
from django.db import models
from django.dispatch import receiver

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
    video = models.FileField(upload_to='product_videos/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Production')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class PurchaseLink(models.Model):
    product = models.ForeignKey(Portfolio, related_name='purchase_links', on_delete=models.CASCADE)
    label = models.CharField(max_length=100)  # e.g., Buy on Amazon, Buy Directly
    url = models.URLField()
    button_color = models.CharField(max_length=20, default='blue')  # Tailwind color (e.g., blue, orange)

    def __str__(self):
        return f"{self.label} ({self.product.title})"

# ✅ Delete video file when Portfolio is deleted
@receiver(models.signals.post_delete, sender=Portfolio)
def auto_delete_video_on_delete(sender, instance, **kwargs):
    if instance.video and os.path.isfile(instance.video.path):
        os.remove(instance.video.path)

# ✅ Delete old video file on update (when replaced)
@receiver(models.signals.pre_save, sender=Portfolio)
def auto_delete_old_video_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return  # Skip new objects

    try:
        old_instance = Portfolio.objects.get(pk=instance.pk)
    except Portfolio.DoesNotExist:
        return

    old_video = old_instance.video
    new_video = instance.video

    if old_video and old_video != new_video and os.path.isfile(old_video.path):
        os.remove(old_video.path)
