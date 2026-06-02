from django.shortcuts import render

def homepage(request):
    return render(request, 'home/home.html')

def privacy(request):
    return render(request, 'home/privacy.html')
