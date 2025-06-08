from django.shortcuts import render
from .models import Portfolio

def product_showcase(request):
    products = Portfolio.objects.all().order_by('-updated_at')
    return render(request, 'portfolio/product_showcase.html', {'products': products})
