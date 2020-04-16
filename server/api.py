from flask import Flask
from flask_restful import Api, Resource
from flask_cors import CORS
from app import Essayist

app = Flask(__name__)
CORS(app)

api = Api(app)

api.add_resource(Essayist, '/get_essay_analysis')

if __name__ == '__main__':
    app.run(debug=True)