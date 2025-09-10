import httpx
import json
from typing import Dict, Any, List, Optional
import asyncio

class OllamaService:
    def __init__(self, base_url: str = "http://ollama:11434"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)
        self.models = {
            "general": "llama2",
            "coding": "codellama",
            "embedding": "nomic-embed-text"
        }
    
    async def initialize_models(self):
        """Pull required models if not available"""
        for model_type, model_name in self.models.items():
            try:
                # Check if model exists
                response = await self.client.get(f"{self.base_url}/api/tags")
                models = response.json().get("models", [])
                
                if not any(m.get("name") == model_name for m in models):
                    print(f"Pulling {model_name} model...")
                    await self.pull_model(model_name)
                    print(f"{model_name} model pulled successfully!")
            except Exception as e:
                print(f"Error initializing {model_name}: {e}")
    
    async def pull_model(self, model_name: str):
        """Pull a model from Ollama registry"""
        response = await self.client.post(
            f"{self.base_url}/api/pull",
            json={"name": model_name},
            timeout=600.0
        )
        return response.json()
    
    async def generate(
        self,
        prompt: str,
        model: str = "llama2",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """Generate text using Ollama"""
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        
        if system_prompt:
            payload["system"] = system_prompt
        
        try:
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=60.0
            )
            
            if response.status_code == 200:
                return response.json().get("response", "")
            else:
                raise Exception(f"Ollama error: {response.text}")
                
        except Exception as e:
            print(f"Error generating text: {e}")
            raise
    
    async def embeddings(self, text: str, model: str = "nomic-embed-text") -> List[float]:
        """Generate embeddings for text"""
        response = await self.client.post(
            f"{self.base_url}/api/embeddings",
            json={
                "model": model,
                "prompt": text
            }
        )
        
        if response.status_code == 200:
            return response.json().get("embedding", [])
        else:
            raise Exception(f"Embedding error: {response.text}")
    
    async def analyze_with_prompt(
        self,
        text: str,
        analysis_type: str,
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze text with specific prompts"""
        
        prompts = {
            "resume": """
                Analyze this resume and extract:
                1. Contact information
                2. Skills (technical and soft skills)
                3. Work experience with dates
                4. Education
                5. Certifications
                6. Overall experience level (junior/mid/senior)
                
                Provide the output in JSON format.
                
                Resume text:
                {text}
            """,
            "proposal": """
                Analyze this proposal and extract:
                1. Project scope and objectives
                2. Timeline and milestones
                3. Budget estimates
                4. Team composition
                5. Technical approach
                6. Risks and mitigation strategies
                
                Provide the output in JSON format.
                
                Proposal text:
                {text}
            """,
            "skills_match": """
                Compare these skills and determine:
                1. Matching skills
                2. Missing skills
                3. Additional skills
                4. Overall match percentage
                5. Recommendations for improvement
                
                Current skills: {current}
                Required skills: {required}
                
                Provide the output in JSON format.
            """
        }
        
        prompt = prompts.get(analysis_type, "").format(
            text=text,
            current=additional_context.get("current", "") if additional_context else "",
            required=additional_context.get("required", "") if additional_context else ""
        )
        
        response = await self.generate(
            prompt=prompt,
            model=self.models.get("general", "llama2"),
            temperature=0.3
        )
        
        # Try to parse JSON response
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # If not valid JSON, return as text
            return {"raw_response": response}
    
    async def check_health(self) -> bool:
        """Check if Ollama service is healthy"""
        try:
            response = await self.client.get(f"{self.base_url}/api/tags")
            return response.status_code == 200
        except:
            return False