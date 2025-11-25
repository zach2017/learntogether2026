# etl/index_dir.py
import glob, json
from embed import embed_text
from chroma_upsert import upsert_chunk

def chunks(text, size=1800, overlap=200):
    words = text.split()
    i = 0
    while i < len(words):
        j = min(i + size, len(words))
        yield " ".join(words[i:j])
        i = j - overlap if j < len(words) else j

for path in glob.glob("data/uspto/*.json"):
    doc = json.load(open(path))
    body = doc["cleaned_text"]
    meta = {k: doc[k] for k in ("doc_id","title","cpc","pub_date","source")}
    for idx, ch in enumerate(chunks(body)):
        vec = embed_text(ch)
        upsert_chunk(doc["doc_id"], idx, ch, meta, vec)
