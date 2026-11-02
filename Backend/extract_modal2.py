import re

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('function RegistrarProyectoModal')
if idx != -1:
    with open('modal_code.txt', 'w', encoding='utf-8') as fw:
        fw.write(content[idx:idx+4000])
