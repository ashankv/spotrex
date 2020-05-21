const nouislider = require('nouislider');
const wnumb = require('wnumb');
const request = require("request");
const search = document.getElementById('search');
const matchList = document.getElementById('match-list');
const tagList = document.getElementById('artist-tag-list');
const recommendationList = document.getElementById('recommendation-list');

var artistMatches = [];
var selectedArtists = [];
var trackRecQueryParams = {};
var currentPlaylist = [];

// Fetch artists from Spotify
const fetchArtists = async (searchText) => {

    let newMatches = []

    if (searchText.length <= 0) {
        artistMatches = newMatches;
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

            artistMatches = newMatches;

            outputSearchResultHtml(artistMatches);
        }
    });
}

// Output search results HTML
function outputSearchResultHtml(matches) {

    var html = ``;

    if (artistMatches.length > 0) {
        html = artistMatches.map(match => {
            return `<button class="list-group-item list-group-item-action d-flex" id="search-result">
                        <img src=${match.image} class="search" width="40" height="40"> </img>
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

function outputRecommendationsHtml() {

    var html = ``;

    if (currentPlaylist.length > 0) {
        html = currentPlaylist.map(track => {
            return `<button class="list-group-item list-group-item-action" id="rec-item">
                        <div class="row">
                            <div class="col-lg-2" >
                                <img src="${track.image}" class="track" width="100" height="100"> </img>
                            </div>

                            <div class="col-lg-9 pt-3 text-left">
                                <h5> ${track.name} </h5>
                                <p> ${track.artists.map(artist => artist.name).join(", ")} </p>
                            </div>
                        </div>
                    </button>`
        }).join('');

        $('#recommendation-header').html("Your Recommendations");

    } else {
        $('#recommendation-header').html("No Recommendations Found");
    }

    recommendationList.innerHTML = html;
}

// Add search listener query
let timeout = null;

search.addEventListener('keyup', () => {

    // clearTimeout(timeout)

    // timeout = setTimeout(() => {
    fetchArtists(search.value);
    // }, 500);
});

// JQuery
$(document).ready(function() {

    // Clicked Search Result
    $('.list-group').on('click', '.list-group-item', function() {

        // Clicked on playlist item
        if ($(this).attr("id") === "rec-item") {
            var clickedIndex = $(this).index('button.list-group-item.list-group-item-action');
            var win = window.open(currentPlaylist[clickedIndex].external_url);

            if (win) { win.focus(); } else { alert('Please allow popups for this website!') }
        }

        if ($(this).attr("id") !== 'search-result') {
            return;
        }

        var artistName = $(this).find("p").text();

        if (selectedArtists.find(match => match.name === artistName)) {
            return;
        }

        var selectedArtist = artistMatches.find(match => match.name == artistName);

        selectedArtists.push(selectedArtist);
        outputArtistTagsHtml();

        // Get playlist recomendations
        trackRecQueryParams['seed_artists'] = selectedArtists.map(artist => artist.id).join();
        fetchPlaylistRecommendation();
        $("#recommendation-header").show();

        console.log(trackRecQueryParams);
        console.log(selectedArtists);

        // Remove current matches
        $('#search').val("");
        artistMatches = [];
        matchList.innerHTML = ``;

        if (selectedArtists.length === 5) {
            $('#search').prop("disabled", true);
            $('#search').attr("placeholder", "Maximum selections reached");
        }
    });

    // Clicked Close Btn on Tag
    $('body').on('click', '.closebtn', function() {
        var artistClicked = $(this).parent().text().replace('×', '').trim();
        console.log(artistClicked + " removed");

        selectedArtists = selectedArtists.filter((artist) => artist.name !== artistClicked);
        outputArtistTagsHtml();

        // Update Playlist Fetch Params
        trackRecQueryParams['seed_artists'] = selectedArtists.map(artist => artist.id).join();
        console.log(trackRecQueryParams);

        // Delete songs from current playlist if there are no selected artists
        if (selectedArtists.length !== 0) {
            fetchPlaylistRecommendation();
            $("#recommendation-header").show();
        } else {
            currentPlaylist = [];
            outputRecommendationsHtml();
            $("#recommendation-header").hide();
        }

        if (selectedArtists.length < 5) {
            $('#search').prop("disabled", false);
            $('#search').attr("placeholder", "Search for artists");
        }

        console.log(selectedArtists);
    });

    $('.dropdown-item').click((event) => {
        var selector = "#" + event.target.id;
        $('#search').attr("placeholder", "Search for " + $(selector).text().toLowerCase());
    });

    // $('#dropdown-artist').click(() => {
    //     $('#dropdown-btn').text("Artists");
    //     $('#search').attr("placeholder", "Search for artists");
    // });
    //
    // $('#dropdown-track').click(() => {
    //     $('#dropdown-btn').text("Tracks");
    //     $('#search').attr("placeholder", "Search for tracks");
    // });
    //
    // $('#dropdown-genre').click(() => {
    //     $('#dropdown-btn').text("Genres");
    //     $('#search').attr("placeholder", "Search for genres");
    // });


    // Clicked outside of the search bar
    $('html').click((element) => {
        if (element.target.id != "search" && !$("#match-list").is(":hidden")) {
            $("#match-list").hide();
        }
    });

    // Clicked on search bar
    $('#search').click(() => {
        $("#match-list").show();
    });

    $('#create-playlist-button').click(() => {

        var playlistName = $('#playlist-name-form').val();
        var userID = "";

        // Need to fetch user ID
        if (currentPlaylist.length !== 0) {

            var getMeOptions = {
                uri: 'https://api.spotify.com/v1/me',
                headers: {'Authorization': 'Bearer ' + accessToken },
                json: true
            }

            request.get(getMeOptions, function(error, response, body) {
                if (!error && response.statusCode === 200) {
                    userID = body.id;
                }

                var getUserUri = "https://api.spotify.com/v1/users/" + userID + "/playlists";
                var playlistID = "";

                var createPlaylistOptions = {
                    uri: getUserUri,
                    body: {
                        name: playlistName,
                        public: true,
                        collaborative: false,
                        description: "Created using SpotRex"
                    },
                    headers: {'Authorization': 'Bearer ' + accessToken },
                    json: true
                }

                request.post(createPlaylistOptions, function(error, response, body) {
                    if (!error && response.statusCode === 201) {

                        playlistID = body.id;
                        var addToPlaylistUri = "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks";

                        var addToPlaylistOptions = {
                            uri: addToPlaylistUri,
                            qs: {
                                uris: currentPlaylist.map(track => track.uri).join()
                            },
                            headers: {'Authorization': 'Bearer ' + accessToken },
                            json: true
                        }

                        request.post(addToPlaylistOptions, function(error, response, body) {
                            if (!error && response.statusCode === 201) {
                                console.log('Successfully created the playlist: ' + playlistName);
                            } else {
                                console.log(error);
                            }
                        });
                    }
                });
            });
        }
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
            outputRecommendationsHtml();
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
