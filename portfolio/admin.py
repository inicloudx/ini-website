from django.contrib import admin
from django import forms
from .models import Portfolio

class PortfolioAdminForm(forms.ModelForm):
    description = forms.CharField(
        widget=forms.Textarea,
        max_length=250,
        help_text='Max 250 characters allowed.'
    )

    class Meta:
        model = Portfolio
        fields = '__all__'

    def clean_description(self):
        data = self.cleaned_data['description']
        if len(data) > 250:
            raise forms.ValidationError("Description must be 250 characters or fewer.")
        return data

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    form = PortfolioAdminForm
    list_display = ('title', 'category', 'status', 'updated_at')
    search_fields = ('title', 'description')
    list_filter = ('category', 'status')

