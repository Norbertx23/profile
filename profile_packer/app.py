from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='.')
CORS(app)


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    
    # Extract data
    posiadane_profile = data.get('profiles', [])
    do_rozlozenia = data.get('items', [])

    posiadane_profile.sort(reverse=True)
    
    do_rozlozenia.sort(key=lambda x: x['wartosc'], reverse=True)
    
    wyniki = {}
    pozostale_miejsce = {}
    
    items_to_distribute = list(do_rozlozenia)
    
    for idx, dlugosc_profilu in enumerate(posiadane_profile):
        klucz = f"Profil_{idx}" 
        aktualne_miejsce = dlugosc_profilu
        wyniki[klucz] = {
            'dlugosc': dlugosc_profilu,
            'elementy': [],
            'wolne': 0
        }
        
        remaining_items = []
        
        for element in items_to_distribute:
            if aktualne_miejsce - element['wartosc'] >= 0:
                aktualne_miejsce -= element['wartosc']
                wyniki[klucz]['elementy'].append(element)
            else:
                remaining_items.append(element)
        
        wyniki[klucz]['wolne'] = aktualne_miejsce
        items_to_distribute = remaining_items

    return jsonify({
        'results': wyniki,
        'unassigned': items_to_distribute
    })

