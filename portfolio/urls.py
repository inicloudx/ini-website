from django.urls import path
from . import views

app_name = 'portfolio'

urlpatterns = [
    path('product-showcase/', views.product_showcase, name='product_showcase'),
    path('product/<int:pk>/', views.product_detail, name='product_detail'),
]

