from flask import Flask, render_template
from flask_restful import Api, Resource
from flask_cors import CORS
from app import Essayist
import nltk

# Download nltk dependencies
nltk.download('treebank')
nltk.download('punkt')

app = Flask(__name__)
CORS(app)

api = Api(app)

@app.route("/")
def start():
    return render_template("index.html")


api.add_resource(Essayist, '/get_essay_analysis')

if __name__ == '__main__':
    app.run(host='0.0.0.0')