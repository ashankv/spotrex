const request = require("request");

const search = document.getElementById('search');
const matchList = document.getElementById('match-list');

// Fetch artists from Spotify
const fetchArtists = async (searchText) => {

    if (searchText.length <= 0) {
        var matches = [];
        matchList.innerHTML = '';
        return;
    }

    var getArtistOptions = {
        uri: 'https://api.spotify.com/v1/search',
        qs: {
            q: searchText,
            type: 'artist',
            limit: '5'
        },
        headers: {'Authorization': 'Bearer ' + accessToken },
        json: true
    }

    await request.get(getArtistOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var matches = body.artists.items.map(artist => {

                console.log(artist.images);

                var image = null;

                if (artist.images.length > 0) {
                    var image = artist.images[0].url;
                }

                var newArtist = {
                    name: artist.name,
                    image: image
                }

                return newArtist;
            });
            outputHtml(matches);
        }
    });
}

function outputHtml(matches) {

    if (matches.length > 0) {
        
        const html = matches.map(match => `
            <a href="#" class="list-group-item list-group-item-warning d-flex justify-content-between mw-100 align-items-center">
                <img src=${match.image} width="40" height="40"> </img>
                <p> \n${match.name} </p>
            </a>
            `).join('');

        matchList.innerHTML = html;
    }
}

let timeout = null;

search.addEventListener('keyup', () => {

    clearTimeout(timeout)

    timeout = setTimeout(() => {
        fetchArtists(search.value);
    }, 200);
});
