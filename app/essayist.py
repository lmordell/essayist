import nltk
import json

import merriam_webster
from requests import get
from flask_restful import Resource
from flask import request,jsonify
from nltk.tokenize import word_tokenize
from sacremoses import MosesDetokenizer
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

class Essayist(Resource):

    def post(self):
        '''
        Entry point for the API request to retrieve the analysis for some text and
        the desired sentiment of the text .
        '''

        analysis = self.get_essay_analysis(request.form['essay_text'], request.form['desired_sentiment'])

        return analysis

    def get_essay_analysis(self, essay_text, desired_sentiment):
        '''
        Get the essay analysis using the VADER Sentiment Analysis package and Merriam-Webster Thesaurus API. 
        VADER is a pre-trained machine learning model the derives the sentiment (positive , neutral negative) 
        from text. Sentiment is scored on a scale from -100 to 100 where -100 is extremely negative, 0 is neutral, 
        and 100 is exremetly positive.
        '''

        # Set a reference to the analyzer
        analyzer = SentimentIntensityAnalyzer()

        # Set a reference to the detokenizer
        detokenizer = MosesDetokenizer(lang='en')

        # Declare analysis dictionary
        analysis = {
            "overall_score": None,
            "text": None,
            "tagged_words": {},
        }

        # Declare the total compound score
        total_compound_score = 0;

        # Split essay text into array of sentences
        sentences = nltk.tokenize.sent_tokenize(essay_text)

        for sentence_idx, sentence in enumerate(sentences):

            # Tokenize the sentence
            tokenized_sentence = word_tokenize(sentence)

            # Find words that do not match desired sentiment. e.g.
            # Desired sentiment = 'positive', tag words like 'terrible' or 'awful'
            # Desired sentiment = 'negative', tag words like 'great', 'wonderful'
            for word_idx, word in enumerate(tokenized_sentence):
                compound_score = analyzer.polarity_scores(word)['compound']

                if (desired_sentiment == 'positive' and compound_score <= -0.1) or (desired_sentiment == 'negative' and compound_score >= 0.1):
                    antonymns = self.get_antonyms(word)

                    analysis['tagged_words'][word] = antonymns

                    tokenized_sentence[word_idx] = f'<span class="tagged-word">{word}</span>' 

            # Detokentize the sentence and replace it since it now contains tagged words
            sentences[sentence_idx] = detokenizer.detokenize(tokenized_sentence)

            # Add the sentence compund sentiment score the total score
            total_compound_score += analyzer.polarity_scores(sentence)['compound']

        # Calculate the overall compound score
        analysis['overall_score'] = round(( total_compound_score / len(sentences) ) * 100)

        # Detokenize the text
        analysis['text'] = detokenizer.detokenize(sentences)

        return analysis
        

    def get_antonyms(self, word):
        '''
        Get the antonyms for a given word from the Merriam-Webster Thesaurus API
        and add them to the analysis
        '''
        url  = f'{merriam_webster.BASE_URL}/{word}?key={merriam_webster.APP_KEY}'
        json = get(url).json()

        # Get the antonyms from the returned json
        antonymns = json[0]['meta']['ants'] if len(json) > 0 else []

        flattened_antonyms = [item for sublist in antonymns for item in sublist];

        return flattened_antonyms




