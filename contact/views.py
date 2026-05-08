from django.shortcuts import render

def contactpage(request):
    return render(request, 'contact/contact.html')
