import spacy
import json
from typing import Dict, List, Optional

class TransferPlanChatbot:
    def __init__(self):
        # Load English language model
        self.nlp = spacy.load("en_core_web_sm")
        
        # Define intent patterns
        self.intent_patterns = {
            "generate_plan": ["generate", "create", "make", "plan", "transfer"],
            "modify_plan": ["modify", "change", "update", "move", "shift"]
        }
        
        # Define entity patterns
        self.entity_patterns = {
            "universities": ["university", "college", "school"],
            "majors": ["major", "degree", "program"],
            "courses": ["course", "class"],
            "terms": ["term", "semester", "quarter"]
        }

    def extract_intent(self, text: str) -> str:
        """Extract the main intent from the user's input."""
        doc = self.nlp(text.lower())
        
        # Check for intent patterns
        for intent, patterns in self.intent_patterns.items():
            if any(pattern in text.lower() for pattern in patterns):
                return intent
        
        return "unknown"

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract entities from the user's input."""
        doc = self.nlp(text)
        entities = {
            "universities": [],
            "majors": [],
            "courses": [],
            "terms": []
        }
        
        # Extract universities (assuming they're proper nouns)
        for ent in doc.ents:
            if ent.label_ == "ORG":
                entities["universities"].append(ent.text)
        
        # Extract majors (assuming they're noun phrases)
        for chunk in doc.noun_chunks:
            if any(pattern in chunk.text.lower() for pattern in self.entity_patterns["majors"]):
                entities["majors"].append(chunk.text)
        
        # Extract courses (assuming they follow a pattern like "CIS 22A")
        for token in doc:
            if token.text.upper().startswith(("CIS", "MATH", "PHYS")):
                entities["courses"].append(token.text)
        
        # Extract terms (assuming they follow a pattern like "Spring 2024")
        for token in doc:
            if token.text in ["Spring", "Summer", "Fall", "Winter"]:
                next_token = token.nbor()
                if next_token.like_num:
                    entities["terms"].append(f"{token.text} {next_token.text}")
        
        return entities

    def process_input(self, text: str) -> Dict:
        """Process user input and return structured data."""
        intent = self.extract_intent(text)
        entities = self.extract_entities(text)
        
        # Clean up empty entity lists
        entities = {k: v for k, v in entities.items() if v}
        
        return {
            "intent": intent,
            "entities": entities
        }

def main():
    chatbot = TransferPlanChatbot()
    
    print("Welcome to the Transfer Plan Chatbot!")
    print("Type 'quit' to exit")
    
    while True:
        user_input = input("\nYou: ").strip()
        
        if user_input.lower() == 'quit':
            break
            
        result = chatbot.process_input(user_input)
        print("\nBot: Extracted information:")
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 