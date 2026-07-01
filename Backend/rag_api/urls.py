from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/',  views.LoginView.as_view(),  name='auth-login'),
    path('auth/logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('dashboard/metrics/', views.DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('rag/query/',          views.RAGQueryView.as_view(),         name='rag-query'),
    path('historial/',          views.HistorialListView.as_view(),    name='historial'),
    path('proyectos/',          views.ProyectosListView.as_view(),    name='proyectos'),
    path('proyectos/<int:pk>/', views.ProyectoDetailView.as_view(),   name='proyecto-detail'),
    path('perfil/',             views.PerfilView.as_view(),           name='perfil'),
    path('rag/upload/',         views.RAGUploadView.as_view(),        name='rag-upload'),
    path('conversaciones/',          views.ConversacionListView.as_view(),   name='conversaciones'),
    path('conversaciones/<int:pk>/', views.ConversacionDetailView.as_view(), name='conversacion-detail'),
    path('xml/upload/',              views.XMLUploadView.as_view(),          name='xml-upload'),
]
