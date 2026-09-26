from django.db import models


class WishEvent(models.Model):
    """Anonymous funnel event for the AR birthday-wish test.

    Stores NO names or messages — those live only in the link's #fragment,
    which never reaches the server. `wid` is a random id per created wish,
    `ref` is the wish that led someone to create a new one (send-back loop).
    """
    EVENTS = [
        ('open', 'Link opened'),
        ('start', 'Tapped open gift'),
        ('song_done', 'Song finished'),
        ('mic_ok', 'Mic allowed'),
        ('mic_denied', 'Mic denied'),
        ('blown', 'Candles blown out'),
        ('room', 'Room view'),
        ('replay', 'Replay'),
        ('send_back', 'Tapped send wish back'),
        ('create_open', 'Creator opened'),
        ('link_created', 'Wish link created'),
        ('wa_share', 'Shared to WhatsApp'),
        ('copy', 'Copied link'),
    ]
    event = models.CharField(max_length=24, choices=EVENTS, db_index=True)
    wid = models.CharField(max_length=12, blank=True, db_index=True)
    ref = models.CharField(max_length=12, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.event} {self.wid}'
