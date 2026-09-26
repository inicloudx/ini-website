from django.db import models


class WishEvent(models.Model):
    """Anonymous funnel event for the AR wish test.

    Stores NO names or messages — those live only in the link's #fragment,
    which never reaches the server. `wid` is a random id per created wish,
    `ref` is the wish that led someone to create a new one (reply loop).
    """
    EVENTS = [
        ('open', 'Link opened'),
        ('start', 'Tapped open gift'),
        ('cam_ok', 'Camera allowed'),
        ('cam_denied', 'Camera denied'),
        ('lit', 'Lit the candles'),
        ('song_done', 'Song finished'),
        ('mic_ok', 'Mic allowed'),
        ('mic_denied', 'Mic denied'),
        ('blown', 'Candles blown out'),
        ('gift_open', 'Opened thank-you gift'),
        ('heart_pop', 'Popped a heart'),
        ('room', 'Room view'),
        ('selfie', 'Selfie view'),
        ('photo', 'Took photo'),
        ('photo_share', 'Shared photo'),
        ('video', 'Recorded video'),
        ('video_share', 'Shared video'),
        ('react', 'Tapped a reaction'),
        ('replay', 'Replay'),
        ('send_back', 'Tapped say thank you'),
        ('create_open', 'Creator opened'),
        ('link_created', 'Wish link created'),
        ('wa_share', 'Shared to WhatsApp'),
        ('copy', 'Copied link'),
    ]
    KINDS = [('bday', 'Birthday'), ('ty', 'Thank you'), ('rx', 'Reaction')]

    event = models.CharField(max_length=24, choices=EVENTS, db_index=True)
    kind = models.CharField(max_length=8, choices=KINDS, blank=True, db_index=True)
    wid = models.CharField(max_length=12, blank=True, db_index=True)
    ref = models.CharField(max_length=12, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.event} {self.kind} {self.wid}'
