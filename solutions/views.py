from django.shortcuts import render

def solutionspage(request):
    return render(request, 'solutions/solutions.html')
