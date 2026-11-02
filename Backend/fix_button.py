import re

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("<button \n<button onClick={e => handleEliminar(p, e)}", "<button onClick={e => handleEliminar(p, e)}")

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed double button syntax error.")
