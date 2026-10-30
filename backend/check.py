from sentence_transformers import SentenceTransformer

m = SentenceTransformer("all-MiniLM-L6-v2")
v = m.encode(["I know React", "Experience with frontend frameworks"], normalize_embeddings=True)
print("Similarity:", float(v[0] @ v[1]))