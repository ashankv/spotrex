from flask import Flask, redirect, url_for, render_template, request
import requests
import math
import random
import urllib.parse as urlgen

app = Flask(__name__)

CLIENT_ID = "6f63cd77e5e643c1b48714c67348e2f3"
CLIENT_SECRET = "929bccc2b1ef4747849b63b50a1d6bc2"
# REDIRECT_URI = "http://www.spotrex.com/callback"
REDIRECT_URI = "https://localhost:5000/callback"

access_token = None
user_img = None
user_name = None

@app.route("/")
def root():
    return render_template("index.html")

@app.route("/error")
def error():
    return "<h1> ERROR </h1>"

@app.route("/login")
def login():

    scope = 'user-read-private user-read-email playlist-modify-public user-read-playback-state user-modify-playback-state'

    auth_params = {'response_type': 'code', 'client_id': CLIENT_ID, 'scope': scope, 'redirect_uri': REDIRECT_URI, }
    auth_url = 'https://accounts.spotify.com/authorize?' + urlgen.urlencode(auth_params)

    return redirect(auth_url)

@app.route("/callback")
def callback():

    code = request.args.get('code')

    token_params = {'grant_type': 'authorization_code', 'code': code, 'redirect_uri': REDIRECT_URI, 'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET}
    token_url = 'https://accounts.spotify.com/api/token'

    token_resp = requests.post(url=token_url, data=token_params)

    if token_resp.status_code == 200:

        json_response = token_resp.json()

        global access_token
        access_token = json_response['access_token']
        refresh_token = json_response['refresh_token']
        expires_in = json_response['expires_in']

        get_me_resp = requests.get(url='https://api.spotify.com/v1/me', headers={'Authorization': 'Bearer ' + access_token}).json()

        global user_name
        global user_img

        user_name = get_me_resp['display_name']
        user_img = get_me_resp['images'][0]['url'] if len(get_me_resp['images']) > 0 else ''

        return redirect(url_for("home"))

    return redirect_uri(url_for("error"))

@app.route("/home")
def home():

    global access_token
    global user_name
    global user_img

    print('TYPE: ', type(access_token))
    if access_token == None:
        return redirect(url_for("login"))

    data = {'access_token': access_token, 'user_img': user_img, 'user_name': user_name}
    print('DATA:', data)

    return render_template("home.html", data=data)


def generate_random_string(length):
    text = ''
    possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for i in range(length):
        text += possible[math.floor(random.random())]

    return text

if __name__ == "__main__":
    app.run(debug=True, ssl_context='adhoc')
