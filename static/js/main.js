
const nouislider = require('nouislider');
const wnumb = require('wnumb');
const request = require("request");
const search = document.getElementById('search');
const matchList = document.getElementById('match-list');
const tagList = document.getElementById('artist-tag-list');

var matches = [];
var selectedArtists = [];
var trackRecQueryParams = {};
var currentPlaylist = [];

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
                    image = artist.images[0].url;
                }

                var newArtist = {
                    name: artist.name,
                    image: image,
                    id: artist.id
                }

                return newArtist;
            });

            matches = newMatches;

            outputSearchResultHtml(matches);
        }
    });
}

// Output search results HTML
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

// Output selected artist tags HTML
function outputArtistTagsHtml() {

    var html = ``;

    if (selectedArtists.length > 0) {
        html = selectedArtists.map(selectedArtist => {
            return `<div class="chip relpos zstackchip ml-1">
                        <img src=${selectedArtist.image} width="96" height="96"> </img>
                        ${selectedArtist.name}
                        <span class="closebtn">&times;</span>
                    </div>`

        }).join('');
    }

    tagList.innerHTML = html;
}

// Add search listener query
let timeout = null;

search.addEventListener('keyup', () => {

    clearTimeout(timeout)

    timeout = setTimeout(() => {
        fetchArtists(search.value);
    }, 500);
});

// JQuery
$(document).ready(function() {

    // Clicked Search Result
    $('.list-group').on('click', '.list-group-item', function() {

        if ($(this).attr("id") !== 'search-result') {
            return;
        }

        var artistName = $(this).find("p").text();

        if (selectedArtists.find(match => match.name === artistName)) {
            return;
        }

        var selectedArtist = matches.find(match => match.name == artistName);

        selectedArtists.push(selectedArtist);
        outputArtistTagsHtml();

        trackRecQueryParams['seed_artists'] = selectedArtists.map(artist => artist.id).join();
        console.log(trackRecQueryParams);

        console.log(selectedArtists);

        // Remove current matches
        $('#search').val("");
        matches = [];
        matchList.innerHTML = ``;

        if (selectedArtists.length == 5) {
            $('#search').prop("disabled", true);
            $('#search').attr("placeholder", "Maximum selected artists reached");
        }
    });

    // Clicked Close Btn on Tag
    $('body').on('click', '.closebtn', function() {
        var artistClicked = $(this).parent().text().replace('×', '').trim();
        console.log(artistClicked + " removed");

        selectedArtists = selectedArtists.filter((artist) => artist.name !== artistClicked);
        outputArtistTagsHtml();

        if (selectedArtists.length < 5) {
            $('#search').prop("disabled", false);
            $('#search').attr("placeholder", "Search for artists");
        }

        console.log(selectedArtists);
    });

    // Clicked outside of the search bar
    $('html').click((element) => {
        if (element.target.id != "search" && !$("#match-list").is(":hidden")) {
            console.log("hidden");
            $("#match-list").hide();
        }
    });

    // Clicked on search bar
    $('#search').click(() => {
        $("#match-list").show();
    });

    // Sliders

    var fill = $(".bar .fill");

    $("#number-track-slider").on("input", () => {
        $(".bar .fill").css("width", $("#number-track-slider").val() + "%");
    });


});

var numberSlider = document.getElementById("number-slider");
nouislider.create(numberSlider, {
    start: [30],
    connect: 'lower',
    step: 5,
    tooltips: [wnumb({ decimals: 0 })],
    range: {
        'min': 5,
        'max': 55
    }
});

var popularitySlider = document.getElementById("popularity-slider");
nouislider.create(popularitySlider, {
    start: [0, 100],
    connect: true,
    range: {
        'min': 0,
        'max': 100
    }
});

var moodSlider = document.getElementById("mood-slider");
nouislider.create(moodSlider, {
    start: [0, 1],
    connect: true,
    range: {
        'min': 0,
        'max': 1
    }
});

var energySlider = document.getElementById("energy-slider");
nouislider.create(energySlider, {
    start: [0, 1],
    connect: true,
    range: {
        'min': 0,
        'max': 1
    }
});

var tempoSlider = document.getElementById("tempo-slider");
nouislider.create(tempoSlider, {
    start: [50, 150],
    connect: true,
    range: {
        'min': 50,
        'max': 150
    }
});

var vocalSlider = document.getElementById("vocal-slider");
nouislider.create(vocalSlider, {
    start: [0, 1],
    connect: true,
    range: {
        'min': 0,
        'max': 1
    }
});

const fetchPlaylistRecommendation = async () => {

    var getRecsOptions = {
        uri: 'https://api.spotify.com/v1/recommendations',
        qs: trackRecQueryParams,
        headers: {'Authorization': 'Bearer ' + accessToken },
        json: true
    }

    await request.get(getRecsOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log(body);

            currentPlaylist = body.tracks.map(track => {

                var trackArtists = track.artists.map(artist => {
                    var newArtist = {
                        'name': artist.name,
                        'uri': artist.uri,
                        'id': artist.id
                    }

                    return newArtist;
                })

                var image = null;

                if (track.album.images.length > 0) {
                    image = track.album.images[0].url;
                }

                var newTrack = {
                    name: track.name,
                    artists: trackArtists,
                    image: image,
                    href: track.href,
                    id: track.id,
                    preview_url: track.preview_url,
                    uri: track.uri,
                    external_url: track.external_urls.spotify
                }

                return newTrack;
            });

            console.log(currentPlaylist);
        }
    });
}

numberSlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['limit'] = parseInt(values[0]);
    console.log(trackRecQueryParams);
    fetchPlaylistRecommendation();
});

popularitySlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_popularity'] = parseInt(values[0]);
    trackRecQueryParams['max_popularity'] = parseInt(values[1]);
    console.log(trackRecQueryParams);
    fetchPlaylistRecommendation();
});

moodSlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_valence'] = values[0];
    trackRecQueryParams['max_valence'] = values[1];
    console.log(trackRecQueryParams);
    fetchPlaylistRecommendation();
});

energySlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_energy'] = values[0];
    trackRecQueryParams['max_energy'] = values[1];
    console.log(trackRecQueryParams);
    fetchPlaylistRecommendation();
});

tempoSlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_tempo'] = parseInt(values[0]);
    trackRecQueryParams['max_tempo'] = parseInt(values[1]);
    console.log(trackRecQueryParams);
    fetchPlaylistRecommendation();
});

vocalSlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_speechiness'] = values[0];
    trackRecQueryParams['max_speechiness'] = values[1];
    console.log(trackRecQueryParams);
    fetchPlaylistRecommendation();
});

trackRecQueryParams = {
    'limit':           parseInt(numberSlider.noUiSlider.get()),
    'seed_artists':    selectedArtists.map(artist => artist.id).join(),
    'min_popularity':  parseInt(popularitySlider.noUiSlider.get()[0]),
    'max_popularity':  parseInt(popularitySlider.noUiSlider.get()[1]),
    'min_valence':     moodSlider.noUiSlider.get()[0],
    'max_valence':     moodSlider.noUiSlider.get()[1],
    'min_energy':      energySlider.noUiSlider.get()[0],
    'max_energy':      energySlider.noUiSlider.get()[1],
    'min_tempo':       parseInt(tempoSlider.noUiSlider.get()[0]),
    'max_tempo':       parseInt(tempoSlider.noUiSlider.get()[1]),
    'min_speechiness': vocalSlider.noUiSlider.get()[0],
    'max_speechiness': vocalSlider.noUiSlider.get()[1],
};
