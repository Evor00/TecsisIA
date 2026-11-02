with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix broken emoji toasts
c = c.replace("showToast(`? Proyecto \"${updated.titulo}\" actualizado`)", "showToast(`\u2705 Proyecto \"${updated.titulo}\" actualizado`)")
c = c.replace("showToast(`V Proyecto \"${nuevo.titulo}\" registrado correctamente`)", "showToast(`\u2705 Proyecto \"${nuevo.titulo}\" registrado correctamente`)")

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Fixed toast messages in ProyectosView.")
