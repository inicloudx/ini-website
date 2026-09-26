from django.urls import path
from . import views

app_name = 'wish'

urlpatterns = [
    path('', views.view_wish, name='view'),
    path('thanks/', views.view_thanks, name='thanks'),
    path('create/', views.create_wish, name='create'),
    path('e/', views.track, name='track'),
    path('stats/', views.stats, name='stats'),
]
