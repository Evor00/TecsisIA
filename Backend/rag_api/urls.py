from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/metrics/', views.DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('rag/query/',          views.RAGQueryView.as_view(),         name='rag-query'),
    path('historial/',          views.HistorialListView.as_view(),    name='historial'),
    path('proyectos/',          views.ProyectosListView.as_view(),    name='proyectos'),
    path('perfil/',             views.PerfilView.as_view(),           name='perfil'),
]
