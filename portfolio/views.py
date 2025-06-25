from django.shortcuts import render, get_object_or_404
from .models import Portfolio

def product_showcase(request):
    products = Portfolio.objects.all().order_by('-updated_at')
    return render(request, 'portfolio/product_showcase.html', {'products': products})

def product_detail(request, pk):
    product = get_object_or_404(Portfolio, pk=pk)
    return render(request, 'portfolio/product_detail.html', {'product': product})