import os
import json
import chromadb
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def build_knowledge_base():
    logger.info("Initializing ChromaDB Persistent Client...")
    
    # Creates a local SQLite vector DB in the chroma_db folder
    db_path = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')
    client = chromadb.PersistentClient(path=db_path)
    
    # Create or get the collection
    collection = client.get_or_create_collection(
        name="audit_reports",
        metadata={"description": "Historical Code4rena and Solodit audit reports"}
    )
    
    # Load our curated test dataset
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'test_dataset.json')
    if not os.path.exists(dataset_path):
        logger.error(f"Dataset not found at {dataset_path}")
        return
        
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    logger.info(f"Loaded {len(data)} records from test_dataset.json")
    
    # Prepare data for ChromaDB
    documents = []
    metadatas = []
    ids = []
    
    for entry in data:
        # We embed the vulnerable code and description so the Auditor can match similar code structures
        doc = f"Vulnerability: {entry['bug_type']}\nDescription: {entry['description']}\nCode:\n{entry['original_contract']}"
        documents.append(doc)
        
        metadatas.append({
            "bug_type": entry["bug_type"],
            "source": entry["source"],
            "severity": entry["severity"],
            "fixed_code_snippet": entry["fixed_contract"][:200] # store a snippet in metadata for fast retrieval
        })
        
        ids.append(entry["id"])
        
    # Upsert into Chroma (this automatically generates embeddings using the default all-MiniLM-L6-v2 model)
    logger.info("Generating vector embeddings and saving to database... This may take a moment on the first run.")
    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    logger.info("✅ Knowledge Base successfully built! ChromaDB is ready.")

if __name__ == "__main__":
    build_knowledge_base()
