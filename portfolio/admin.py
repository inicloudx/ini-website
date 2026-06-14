from django.contrib import admin
from django import forms
from .models import Portfolio, PurchaseLink


class PurchaseLinkInline(admin.TabularInline):
    model = PurchaseLink
    extra = 1


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display  = ('title', 'category', 'status', 'android', 'ios', 'meta_quest', 'web_app', 'available_date', 'updated_at')
    list_filter   = ('category', 'status', 'android', 'ios', 'meta_quest', 'web_app')
    search_fields = ('title', 'tagline', 'description')
    inlines       = [PurchaseLinkInline]

    fieldsets = (
        ('Core Information', {
            'fields': ('title', 'tagline', 'category', 'status', 'available_date', 'description', 'features'),
        }),
        ('Media', {
            'fields': ('youtube_link', 'video'),
        }),
        ('Platforms', {
            'fields': (
                ('android', 'google_play_url'),
                ('ios',     'app_store_url'),
                ('meta_quest', 'meta_store_url'),
                ('web_app',    'web_app_url'),
            ),
            'description': 'Enable platforms and paste their store URLs.',
        }),
        ('Stats (optional)', {
            'fields': ('downloads_count', 'rating'),
            'classes': ('collapse',),
        }),
    )
