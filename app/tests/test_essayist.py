import json
import unittest
import pprint

from api import application

class UnitTest(unittest.TestCase):

    def setUp(self):
        self.app = application.test_client()

    def test_index_page(self):
        response = self.app.get('/', headers={"Content-Type": "html/text"})

        self.assertEqual(response.status_code, 200, msg='Fetched page successfully')

        self.assertTrue('<title>Essayist</title>' in str(response.data), msg="HTML content returned successfully")

    def test_opposite_sentiment(self):
        text = "I love my wife. I think she's great."
        desired_sentiment = 'negative'

        payload = json.dumps({
            'essay_text': text,
            'desired_sentiment': desired_sentiment
        })

        response = self.app.post('/get_essay_analysis', headers={"Content-Type": "application/json"}, data=payload)
        self.assertEqual(response.status_code, 200, msg='Fetched analysis successfully')

        actual_text = response.json['text']
        actual_score = response.json['overall_score'] # 63
        tagged_words = response.json['tagged_words']

        expected_text = 'I <span class="opposite-tone-word">love</span> my wife. I think she\'s <span class="opposite-tone-word">great</span>.'

        self.assertEqual(str(actual_text), str(expected_text), msg='Analyzed text correctly tags tone words')
        self.assertEqual(actual_score, 63, msg='Analysis gave a positive score for tone')
        self.assertEqual(tagged_words['love'][0], 'abomination', msg='Give antonyms for tagged words')

    def test_matching_sentiment(self):
        text = "I hate this sports team. They are terrible."
        desired_sentiment = 'negative'

        payload = json.dumps({
            'essay_text': text,
            'desired_sentiment': desired_sentiment
        })

        response = self.app.post('/get_essay_analysis', headers={"Content-Type": "application/json"}, data=payload)
        self.assertEqual(response.status_code, 200, msg='Fetched analysis successfully')

        actual_text = response.json['text']
        actual_score = response.json['overall_score'] # 63
        tagged_words = response.json['tagged_words']

        expected_text = 'I <span class="match-tone-word">hate</span> this sports team. They are <span class="match-tone-word">terrible</span>.'

        self.assertEqual(str(actual_text), str(expected_text), msg='Analyzed text correctly tags tone words')
        self.assertEqual(actual_score, -52, msg='Analysis gave a negative score for tone')
        self.assertEqual(tagged_words['hate'][0], 'abhorrence', msg='Give synonyms for tagged words')
