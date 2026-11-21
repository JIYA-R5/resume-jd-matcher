from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

sentences = [
    "I know React",
    "Experience with frontend frameworks and React",
]

vec = TfidfVectorizer(stop_words="english")
X = vec.fit_transform(sentences)
sim = cosine_similarity(X[0:1], X[1:2])[0][0]
print("TF-IDF Cosine Similarity:", round(float(sim), 4))

