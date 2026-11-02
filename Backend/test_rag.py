import httpx

# 1. Login to get token
try:
    login_resp = httpx.post('http://localhost:8000/api/auth/login/', json={
        'email': 'admin@tecsup.edu.pe',
        'password': 'admin'
    })
    token = login_resp.json().get('token')
    
    if not token:
        print("Login failed!", login_resp.text)
        exit(1)
        
    print("Logged in successfully.")
    
    # 2. Query the RAG endpoint
    query_resp = httpx.post('http://localhost:8000/api/rag/query/', 
        json={'prompt': 'muestrame las tesis de react'},
        headers={'Authorization': f'Bearer {token}'},
        timeout=30.0
    )
    print("RAG Query status code:", query_resp.status_code)
    
    data = query_resp.json()
    print("Respuesta del IA:")
    print("-" * 40)
    print(data.get('answer', 'Sin respuesta'))
    print("-" * 40)
    
except Exception as e:
    print(f"Error occurred: {e}")
