from flask import Flask, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

"""
TODO
 - fix border offsets
 - keyboard selection and entering
 - number of cards is wrong on start
 - multiplayer
"""

def genDeckRec(i, n, card):
    if i == n:
        return [card.copy()]
    
    ret = []
    card[i] = 0
    ret.extend(genDeckRec(i+1, n, card))
    card[i] = 1
    ret.extend(genDeckRec(i+1, n, card))

    return ret

def genDeck(n):
    deck = genDeckRec(0, n, [0]*n)[1:] # permutations without all 0's
    random.shuffle(deck)
    return deck 

def checkSet(cards):
    base = [0] * 6
    for card in cards:
        base = [a + b for a, b in zip(base, card)]
    
    for elem in base:
        if elem % 2 == 1:
            return False
    return True

def genAllSolutionsRec(i, n, sofar, cards):
    if i == n:
        return [sofar]

    ret = genAllSolutionsRec(i+1, n, sofar, cards) + genAllSolutionsRec(i+1, n, sofar + [(i, cards[i])], cards)

    return ret

def genAllSolutions(cards):
    return genAllSolutionsRec(0, len(cards), [], cards)[1:]


def getSolution(cards):
    all_solutions = genAllSolutions(cards)

    for soln in all_solutions:
        cur_idx = [x[0] for x in soln]
        cur_cards = [x[1] for x in soln]

        if checkSet(cur_cards):
            return cur_idx

deck = genDeck(6)

@app.route('/restart', methods=['POST'])
def restart():
    global deck
    deck = genDeck(6)
    return jsonify({"remaining": len(deck)})

@app.route('/get_card', methods=['GET'])
def get_card():
    """Return a card from the deck in the form [a, b, c, d, e, f]."""
    global deck

    if len(deck) == 0:
        return jsonify({'done': 'No more cards in the deck', 'remaining': len(deck)})

    card = deck.pop(0)  # Replace with your logic if needed
    return jsonify({'card': card, 'remaining': len(deck)})

@app.route('/submit_cards', methods=['POST'])
def submit_cards():
    """Process selected cards and return a boolean callback."""
    data = request.json
    print("Received selected cards:", data)

    should_redeal = checkSet(data)
    return jsonify(should_redeal)

@app.route('/solve', methods=['POST'])
def solve():
    data = request.json  # Expecting a list of cards
    print("Received board state:", data)

    indices = getSolution(data)
    return jsonify(indices)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
