from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import JsonResponse
from django.views.static import serve
from django.template.response import TemplateResponse
import os

def dynamic_home_view(request):
    host = request.get_host()
    if '127.0.0.1' in host:
        return JsonResponse({"status": "Backend running"})
    # Otherwise render frontend for localhost
    return TemplateResponse(request, 'index.html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('backend.reviews.urls')),
    path('assets/<path:path>', serve, kwargs={'document_root': os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'assets')}),
    path('', dynamic_home_view, name='home'),
]
