const request = require("request");

const search = document.getElementById('search');
const matchList = document.getElementById('match-list');
const tagList = document.getElementById('artist-tag-list');

var matches = [];
var selectedArtists = [];

// Fetch artists from Spotify
const fetchArtists = async (searchText) => {

    let newMatches = []

    if (searchText.length <= 0) {
        matches = newMatches;
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

            newMatches = body.artists.items.map(artist => {

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

            matches = newMatches;

            outputSearchResultHtml(matches);
        }
    });
}

function outputSearchResultHtml(matches) {

    var html = ``;

    if (matches.length > 0) {
        html = matches.map(match => {
            return `<button class="list-group-item list-group-item-action d-flex" id="search-result">
                        <img src=${match.image} width="40" height="40"> </img>
                        <div class="pt-2 pl-2 text-left"> <p>${match.name}</p> </div>
                    </button>`
        }).join('');
    }

    matchList.innerHTML = html;
}

function outputArtistTagsHtml() {

    var html = ``;

    if (selectedArtists.length > 0) {
        html = selectedArtists.map(selectedArtist => {
            return `<div class="chip relpos zstackchip ml-1">
                        <img src=${selectedArtist.image} width="96" height="96"> </img>
                        ${selectedArtist.name}
                        <span class="closebtn" onclick="this.parentElement.style.display='none'">&times;</span>
                    </div>`

        }).join('');
    }

    tagList.innerHTML = html;
}

let timeout = null;

search.addEventListener('keyup', () => {

    clearTimeout(timeout)

    timeout = setTimeout(() => {
        fetchArtists(search.value);
    }, 500);
});

$(document).ready(function() {

    $('.list-group').on('click', '.list-group-item', function() {

        var artistName = $(this).find("p").text();

        if (selectedArtists.find(match => match.name === artistName)) {
            return;
        }

        var selectedArtist = matches.find(match => match.name == artistName);

        selectedArtists.push(selectedArtist);

        console.log(selectedArtists);
        outputArtistTagsHtml();

        $('#search').val("");
        matches = [];
        matchList.innerHTML = ``;
    });

    $('html').click((element) => {
        if (element.target.id != "search" && !$("#match-list").is(":hidden")) {
            console.log("hidden");
            $("#match-list").hide();
        }
    });

    $('#search').click(() => {
        $("#match-list").show();
    });
});
