from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import json

class ActionProcessPlan(Action):
    def name(self) -> Text:
        return "action_process_plan"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        university = tracker.get_slot("university")
        major = tracker.get_slot("major")
        
        if not university or not major:
            dispatcher.utter_message(text="I need both university and major to generate a plan.")
            return []
        
        # Create the structured output
        result = {
            "intent": "generate_plan",
            "entities": {
                "universities": [university],
                "majors": [major]
            }
        }
        
        dispatcher.utter_message(text=f"I'll generate a transfer plan for {university} in {major}.")
        dispatcher.utter_message(text=f"Structured data: {json.dumps(result, indent=2)}")
        
        return []

class ActionModifyPlan(Action):
    def name(self) -> Text:
        return "action_modify_plan"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        course = tracker.get_slot("course")
        term = tracker.get_slot("term")
        
        if not course or not term:
            dispatcher.utter_message(text="I need both course and term to modify the plan.")
            return []
        
        # Create the structured output
        result = {
            "intent": "modify_plan",
            "entities": {
                "action": "move",
                "course": course,
                "term": term
            }
        }
        
        dispatcher.utter_message(text=f"I'll move {course} to {term}.")
        dispatcher.utter_message(text=f"Structured data: {json.dumps(result, indent=2)}")
        
        return [] 