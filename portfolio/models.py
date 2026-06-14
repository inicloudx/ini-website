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
        ('Available', 'Available'),
        ('Beta', 'Beta'),
        ('Coming Soon', 'Coming Soon'),
    ]

    # ── Core Info ─────────────────────────────────────────────
    title       = models.CharField(max_length=200)
    tagline     = models.CharField(max_length=200, blank=True, help_text='Short one-liner shown on cards (e.g. "AR Alphabet for Kids")')
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(help_text='Full product description (shown on detail page)')
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    available_date = models.DateField(null=True, blank=True, help_text='Launch / availability date')

    # ── Media ─────────────────────────────────────────────────
    youtube_link = models.URLField(blank=True, null=True, help_text='YouTube embed URL (e.g. https://www.youtube.com/embed/xxxx)')
    video        = models.FileField(upload_to='product_videos/', blank=True, null=True)

    # ── Platforms ─────────────────────────────────────────────
    android    = models.BooleanField(default=False, verbose_name='Android (Google Play)')
    ios        = models.BooleanField(default=False, verbose_name='iOS (App Store)')
    meta_quest = models.BooleanField(default=False, verbose_name='Meta Quest')
    web_app    = models.BooleanField(default=False, verbose_name='Web / WebAR')

    # ── Store Links ───────────────────────────────────────────
    google_play_url = models.URLField(blank=True, verbose_name='Google Play URL')
    app_store_url   = models.URLField(blank=True, verbose_name='App Store URL')
    meta_store_url  = models.URLField(blank=True, verbose_name='Meta Quest Store URL')
    web_app_url     = models.URLField(blank=True, verbose_name='Web App URL')

    # ── Stats ─────────────────────────────────────────────────
    downloads_count = models.CharField(max_length=20, blank=True, help_text='e.g. 10K+, 1M+')
    rating          = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True, help_text='Rating out of 5')

    # ── Features (one per line) ───────────────────────────────
    features = models.TextField(blank=True, help_text='Key features — one per line. Shown as bullet points.')

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return self.title

    def get_features_list(self):
        return [f.strip() for f in self.features.splitlines() if f.strip()]

    def get_platforms(self):
        platforms = []
        if self.android:    platforms.append(('android',    'Android',    self.google_play_url))
        if self.ios:        platforms.append(('ios',        'iOS',        self.app_store_url))
        if self.meta_quest: platforms.append(('meta',       'Meta Quest', self.meta_store_url))
        if self.web_app:    platforms.append(('web',        'Web / AR',   self.web_app_url))
        return platforms

    def get_star_range(self):
        if self.rating:
            full  = int(self.rating)
            half  = 1 if (self.rating - full) >= 0.5 else 0
            empty = 5 - full - half
            return range(full), range(half), range(empty)
        return range(0), range(0), range(5)


class PurchaseLink(models.Model):
    product      = models.ForeignKey(Portfolio, related_name='purchase_links', on_delete=models.CASCADE)
    label        = models.CharField(max_length=100)
    url          = models.URLField()
    button_color = models.CharField(max_length=20, default='blue')

    def __str__(self):
        return f"{self.label} ({self.product.title})"


@receiver(models.signals.post_delete, sender=Portfolio)
def auto_delete_video_on_delete(sender, instance, **kwargs):
    if instance.video and os.path.isfile(instance.video.path):
        os.remove(instance.video.path)


@receiver(models.signals.pre_save, sender=Portfolio)
def auto_delete_old_video_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = Portfolio.objects.get(pk=instance.pk)
    except Portfolio.DoesNotExist:
        return
    if old_instance.video and old_instance.video != instance.video:
        if os.path.isfile(old_instance.video.path):
            os.remove(old_instance.video.path)
