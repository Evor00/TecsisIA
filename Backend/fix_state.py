import re

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r"const \[showModal,\s*setShowModal\]\s*=\s*useState\(false\)",
    "const [showModal, setShowModal]       = useState(false)\n  const [editingProyecto, setEditingProyecto] = useState(null)",
    content
)

with open(r'D:\TecsisAi-2\Frontend\frontend_admin\src\views\ProyectosView.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed editingProyecto state.")
