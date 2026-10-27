Add-Type -AssemblyName System.Drawing

$w = 1920
$h = 1080
$bmp = [System.Drawing.Bitmap]::new($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

function C($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function B($hex) { [System.Drawing.SolidBrush]::new((C $hex)) }
function P($hex, $width=2) { [System.Drawing.Pen]::new((C $hex), $width) }
function F($size, $style='Regular') { [System.Drawing.Font]::new('Segoe UI', $size, [System.Drawing.FontStyle]::$style, [System.Drawing.GraphicsUnit]::Pixel) }
function M($size) { [System.Drawing.Font]::new('Consolas', $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel) }

function RoundPath($x,$y,$w,$h,$r) {
  $p = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $r * 2
  $p.AddArc($x,$y,$d,$d,180,90)
  $p.AddArc($x+$w-$d,$y,$d,$d,270,90)
  $p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90)
  $p.AddArc($x,$y+$h-$d,$d,$d,90,90)
  $p.CloseFigure()
  return $p
}

function Box($x,$y,$w,$h,$r,$fill,$stroke='#dbe3ef',$sw=2) {
  if ($r -le 0) {
    $g.FillRectangle((B $fill), $x, $y, $w, $h)
    if ($sw -gt 0) { $g.DrawRectangle((P $stroke $sw), $x, $y, $w, $h) }
    return
  }
  $path = RoundPath $x $y $w $h $r
  $g.FillPath((B $fill), $path)
  $g.DrawPath((P $stroke $sw), $path)
  $path.Dispose()
}

function T($txt,$x,$y,$font,$color='#0f172a',$mw=1000,$mh=60) {
  $rect = [System.Drawing.RectangleF]::new($x,$y,$mw,$mh)
  $fmt = [System.Drawing.StringFormat]::new()
  $fmt.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  $g.DrawString($txt,$font,(B $color),$rect,$fmt)
}

function Entity($x,$y,$w,$h,$title,$color,$fields) {
  Box $x $y $w $h 22 '#ffffff'
  Box $x $y $w 64 22 $color $color 1
  $g.FillRectangle((B $color), $x, ($y+32), $w, 32)
  T $title ($x+24) ($y+17) (F 25 'Bold') '#ffffff' ($w-120) 40
  Box ($x+$w-100) ($y+18) 68 28 14 '#ffffff' '#ffffff' 1
  T 'PK id' ($x+$w-85) ($y+23) (F 15 'Bold') $color 55 24
  $fy = $y + 88
  foreach ($field in $fields) {
    $colorText = '#1e293b'
    if ($field.Contains('->')) { $colorText = '#2563eb' }
    if ($field.StartsWith('*')) { $colorText = '#64748b'; $field = $field.Substring(1) }
    T $field ($x+26) $fy (M 18) $colorText ($w-52) 28
    $fy += 31
  }
}

function Arrow($x1,$y1,$x2,$y2,$color,$label,$lx,$ly) {
  $pen = P $color 4
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::ArrowAnchor
  $g.DrawLine($pen,$x1,$y1,$x2,$y2)
  Box ($lx-10) ($ly-5) 315 34 17 '#ffffff' '#e2e8f0' 1
  T $label $lx $ly (F 16 'Bold') '#0f172a' 300 25
}

$g.Clear((C '#f8fafc'))
Box 0 0 $w $h 0 '#f8fafc' '#f8fafc' 0
T 'Modelo Entidad-Relacion - TecSis IA' 70 48 (F 48 'Bold') '#0f172a' 1200 70
T 'Modelo MER del backend: usuarios, tesis, documentos RAG, auditoria y conversaciones del asistente' 74 110 (F 22) '#475569' 1450 34

Box 60 160 1800 225 28 '#e0f2fe' '#c7e7fb' 1
Box 60 420 1800 260 28 '#dcfce7' '#bbf7d0' 1
Box 60 715 1800 275 28 '#ffedd5' '#fed7aa' 1
T 'SEGURIDAD Y CATALOGO' 90 180 (F 16 'Bold') '#334155' 360 24
T 'RAG / INDEXACION SEMANTICA' 90 440 (F 16 'Bold') '#334155' 420 24
T 'CHAT Y AUDITORIA' 90 735 (F 16 'Bold') '#334155' 360 24

Entity 115 225 390 300 'USUARIOS' '#2563eb' @(
  'id SERIAL PK',
  'nombre VARCHAR(150)',
  'email UNIQUE',
  'password_hash',
  'rol, codigo_docente',
  '*departamento, biografia',
  '*estado, timestamps'
)

Entity 675 205 455 360 'TESIS' '#059669' @(
  'id SERIAL PK',
  'codigo UNIQUE',
  'titulo, autor, grupo',
  'tecnologias JSON',
  'promocion, estado',
  'usuario_id -> usuarios.id',
  '*ruta_pdf, score, activo',
  '*fecha_subida, timestamps'
)

Entity 1270 425 455 250 'DOCUMENTOS_RAG' '#7c3aed' @(
  'id SERIAL PK',
  'tesis_id -> tesis.id',
  'contenido_texto TEXT',
  'embedding VECTOR',
  'pagina_origen, chunk_index'
)

Entity 145 765 410 220 'LOG_CONSULTAS' '#ea580c' @(
  'id SERIAL PK',
  'usuario_id -> usuarios.id',
  'prompt_ingresado TEXT',
  'resultado JSON'
)

Entity 730 750 365 205 'CONVERSACIONES' '#0f766e' @(
  'id SERIAL PK',
  'usuario_id -> usuarios.id',
  'titulo VARCHAR(200)',
  '*created_at, updated_at'
)

Entity 1280 750 390 220 'MENSAJES' '#9333ea' @(
  'id SERIAL PK',
  'conversacion_id -> conversaciones.id',
  'rol: user | assistant',
  'contenido TEXT'
)

Arrow 505 375 675 375 '#2563eb' '1 usuario -> N tesis' 515 166
Arrow 1130 505 1270 535 '#059669' '1 tesis -> N chunks' 1165 385
Arrow 320 525 320 765 '#ea580c' '1 usuario -> N consultas' 340 642
Arrow 505 455 730 805 '#0f766e' '1 usuario -> N conversaciones' 505 628
Arrow 1095 835 1280 845 '#9333ea' '1 conversacion -> N mensajes' 1035 798

Box 1180 205 500 130 24 '#ffffff' '#dbe3ef' 2
T 'Como explicarlo en la presentacion' 1210 230 (F 21 'Bold') '#0f172a' 430 30
T '1. El docente registra o sube una tesis.' 1210 265 (F 17) '#475569' 440 25
T '2. El PDF/XML se divide en documentos_rag.' 1210 292 (F 17) '#475569' 440 25
T '3. Las consultas guardan trazabilidad.' 1210 319 (F 17) '#475569' 450 25

T 'Cardinalidades: USUARIOS 1:N TESIS | TESIS 1:N DOCUMENTOS_RAG | USUARIOS 1:N LOG_CONSULTAS | USUARIOS 1:N CONVERSACIONES | CONVERSACIONES 1:N MENSAJES' 75 1018 (F 18 'Bold') '#334155' 1760 34

$out = 'C:\TecsisAi\MER_TecSisIA_ordenado.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output $out
