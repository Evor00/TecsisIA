from django.db import models


class Usuario(models.Model):
    nombre         = models.CharField(max_length=150)
    email          = models.EmailField(unique=True)
    password_hash  = models.CharField(max_length=255, default='CHANGEME')
    rol            = models.CharField(max_length=10, default='docente')
    codigo_docente = models.CharField(max_length=20, null=True, unique=True)
    departamento   = models.CharField(max_length=100, null=True, blank=True)
    biografia      = models.TextField(null=True, blank=True)
    estado         = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'usuarios'
        managed  = False  # La tabla ya existe — Django no la toca


class Tesis(models.Model):
    codigo           = models.CharField(max_length=20, unique=True, null=True, blank=True)
    titulo           = models.CharField(max_length=350)
    autor            = models.CharField(max_length=250)
    grupo            = models.CharField(max_length=50, null=True, blank=True)
    tecnologias      = models.JSONField(default=list)
    promocion        = models.CharField(max_length=10)
    estado           = models.CharField(max_length=20, default='En Revisión')
    ruta_pdf         = models.CharField(max_length=500, null=True, blank=True)
    usuario          = models.ForeignKey(
                           Usuario,
                           on_delete=models.SET_NULL,
                           null=True,
                           db_column='usuario_id',
                       )
    fecha_subida     = models.DateTimeField(auto_now_add=True)
    similitud_maxima = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    score            = models.CharField(max_length=10, null=True, blank=True)
    activo           = models.BooleanField(default=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tesis'
        managed  = False


class DocumentoRAG(models.Model):
    tesis           = models.ForeignKey(Tesis, on_delete=models.CASCADE, related_name='documentos')
    contenido_texto = models.TextField()
    # embedding: omitido — se maneja desde el pipeline LangChain/LlamaIndex
    pagina_origen   = models.SmallIntegerField()
    chunk_index     = models.SmallIntegerField(default=0)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'documentos_rag'
        managed  = False
        unique_together = [('tesis', 'pagina_origen', 'chunk_index')]


class LogConsulta(models.Model):
    usuario           = models.ForeignKey(
                            Usuario,
                            on_delete=models.SET_NULL,
                            null=True,
                            db_column='usuario_id',
                        )
    prompt_ingresado  = models.TextField()
    resultado         = models.JSONField(null=True, blank=True)
    tokens_procesados = models.IntegerField(default=0)
    fecha             = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'log_consultas'
        managed  = False
        ordering = ['-fecha']


class Conversacion(models.Model):
    usuario    = models.ForeignKey(
                     Usuario,
                     on_delete=models.CASCADE,
                     null=True,
                     db_column='usuario_id',
                 )
    titulo     = models.CharField(max_length=200, default='Nueva conversación')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversaciones'
        managed  = False
        ordering = ['-updated_at']


class Mensaje(models.Model):
    conversacion = models.ForeignKey(
                       Conversacion,
                       on_delete=models.CASCADE,
                       related_name='mensajes',
                       db_column='conversacion_id',
                   )
    rol          = models.CharField(max_length=12, default='user')  # 'user' | 'assistant'
    contenido    = models.TextField()
    documentos   = models.JSONField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mensajes'
        managed  = False
        ordering = ['created_at']
