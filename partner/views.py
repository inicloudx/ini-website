from django.shortcuts import render

def partnerpage(request):
    return render(request, 'partner/partner.html')
