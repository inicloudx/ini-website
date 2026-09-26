from django.contrib import admin
from .models import WishEvent


@admin.register(WishEvent)
class WishEventAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'event', 'wid', 'ref')
    list_filter = ('event',)
    search_fields = ('wid', 'ref')
    date_hierarchy = 'created_at'
