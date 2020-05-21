const nouislider = require('nouislider');
const wnumb = require('wnumb');
const request = require("request");
const search = document.getElementById('search');
const matchList = document.getElementById('match-list');
const tagList = document.getElementById('artist-tag-list');
const recommendationList = document.getElementById('recommendation-list');

var searchMatches = [];
var selectedTags = [];

var selectedArtists = [];
var selectedTracks = [];
var selectedGenres = [];

var trackRecQueryParams = {};
var currentPlaylist = [];

// Fetch artists from Spotify
const fetchArtistsOrTracks = async (searchText) => {

    let type = "";
    let newMatches = [];

    if ($('#dropdown-btn').text().trim() == "Artists") {
        type = "artist";
    } else {
        type = "track";
    }

    if (searchText.length <= 0) {
        searchMatches = newMatches;
        matchList.innerHTML = '';
        return;
    }

    var getSearchOptions = {
        uri: 'https://api.spotify.com/v1/search',
        qs: {
            q: searchText,
            type: type,
            limit: '5'
        },
        headers: {'Authorization': 'Bearer ' + accessToken },
        json: true
    }

    await request.get(getSearchOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            // console.log(body);
            var newBody = [];

            if (type == "artist") {
                newBody = body.artists;
            } else {
                newBody = body.tracks;
            }

            newMatches = newBody.items.map(match => {

                var image = null;

                if (type == "artist") {
                    if (match.images.length > 0) {
                        image = match.images[0].url;
                    }
                } else {
                    if (match.album.images.length > 0) {
                        image = match.album.images[0].url;
                    }
                }

                var newMatch = {
                    name: match.name,
                    image: image,
                    id: match.id,
                    type: type
                }

                return newMatch;
            });

            searchMatches = newMatches;
            outputSearchResultHtml(searchMatches);
        }
    });
}

// Output search results HTML
function outputSearchResultHtml(matches) {

    var html = ``;

    if (matches.length > 0) {
        html = matches.map(match => {
            return `<button class="list-group-item list-group-item-action d-flex" id="search-result">
                        <img src=${match.image} class="search" width="40" height="40"> </img>
                        <div class="pt-2 pl-2 text-left"> <p>${match.name}</p> </div>
                    </button>`
        }).join('');
    }

    matchList.innerHTML = html;
}

// Output selected artist tags HTML
function outputSelectedTagsHtml() {

    var html = ``;

    if (selectedTags.length > 0) {
        html = selectedTags.map(selectedTag => {

            var modifiedName = selectedTag.name.replace(/ *\([^)]*\) */g, "");

            return `<div class="chip relpos zstackchip ml-1">
                        <img src=${selectedTag.image} width="96" height="96"> </img>
                        ${modifiedName}
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
    fetchArtistsOrTracks(search.value);
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

        var tagName = $(this).find("p").text();

        if (selectedTags.find(match => match.name === tagName)) {
            return;
        }

        var selectedTag = searchMatches.find(match => match.name == tagName);

        if (selectedTag.type === "artist") {
            selectedArtists.push(selectedTag);
        } else if (selectedTag.type === "track") {
            selectedTracks.push(selectedTag);
        } else if (selectedTag.type === "genre") {
            selectedGenres.push(selectedTag);
        }

        selectedTags.push(selectedTag);
        outputSelectedTagsHtml();

        // Get playlist recommendations
        trackRecQueryParams['seed_artists'] = selectedArtists.map(artist => artist.id).join();
        trackRecQueryParams['seed_tracks'] = selectedTracks.map(track => track.id).join();
        trackRecQueryParams['seed_genres'] = selectedGenres.map(genre => genre.id).join();

        fetchPlaylistRecommendation();
        $("#recommendation-header").show();

        console.log(selectedTags);

        // Remove current matches
        $('#search').val("");
        searchMatches = [];
        matchList.innerHTML = ``;

        if (selectedTags.length === 5) {
            $('#search').prop("disabled", true);
            $('#search').attr("placeholder", "Maximum selections reached");
        }
    });

    // Clicked Close Btn on Tag
    $('#artist-tag-list').on('click', '.closebtn', function() {

        var tagIndex = $(this).parent().index();
        var tagToRemove = selectedTags[tagIndex];

        console.log(tagToRemove.name + " removed");

        selectedTags = selectedTags.filter((tag) => tag.name !== tagToRemove.name && tag.id !== tagToRemove.id);

        // Update Playlist Fetch Params and Selected Tags
        if (tagToRemove.type === "artist") {
            selectedArtists = selectedArtists.filter((tag) => tag.name !== tagToRemove.name && tag.id !== tagToRemove.id);
            trackRecQueryParams['seed_artists'] = selectedArtists.map(artist => artist.id).join();
        } else if (tagToRemove.type === "track") {
            selectedTracks = selectedTracks.filter((tag) => tag.name !== tagToRemove.name && tag.id !== tagToRemove.id);
            trackRecQueryParams['seed_tracks'] = selectedTracks.map(track => track.id).join();
        } else if (tagToRemove.type === "genre") {
            selectedGenres = selectedGenres.filter((tag) => tag.name !== tagToRemove.name && tag.id !== tagToRemove.id);
            trackRecQueryParams['seed_genres'] = selectedGenres.map(genre => genre.id).join();
        }

        outputSelectedTagsHtml();

        // Delete songs from current playlist if there are no selected artists
        if (selectedTags.length !== 0) {
            fetchPlaylistRecommendation();
            $("#recommendation-header").show();
        } else {
            currentPlaylist = [];
            outputRecommendationsHtml();
            $("#recommendation-header").hide();
        }

        if (selectedTags.length < 5) {
            $('#search').prop("disabled", false);
            $('#search').attr("placeholder", "Search for " + $("#dropdown-btn").text().toLowerCase().trim());
        }

        console.log(selectedTags);
    });

    $('.dropdown-item').click((event) => {
        var selector = "#" + event.target.id;
        $('#search').attr("placeholder", "Search for " + $(selector).text().toLowerCase());
        $('#dropdown-btn').text($(selector).text());
        $('#search').val('');
        outputSearchResultHtml([]);
    });

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

    console.log(trackRecQueryParams);

    // Clean up null values
    var newTrackRecQueryParams = {};

    for (var property in trackRecQueryParams) {
        if (trackRecQueryParams[property] != null && trackRecQueryParams[property] != "") {
            newTrackRecQueryParams[property] = trackRecQueryParams[property];
        }
    }

    console.log(newTrackRecQueryParams);

    var getRecsOptions = {
        uri: 'https://api.spotify.com/v1/recommendations',
        qs: newTrackRecQueryParams,
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
    fetchPlaylistRecommendation();
});

popularitySlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_popularity'] = parseInt(values[0]);
    trackRecQueryParams['max_popularity'] = parseInt(values[1]);
    fetchPlaylistRecommendation();
});

moodSlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_valence'] = values[0];
    trackRecQueryParams['max_valence'] = values[1];
    fetchPlaylistRecommendation();
});

energySlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_energy'] = values[0];
    trackRecQueryParams['max_energy'] = values[1];
    fetchPlaylistRecommendation();
});

tempoSlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_tempo'] = parseInt(values[0]);
    trackRecQueryParams['max_tempo'] = parseInt(values[1]);
    fetchPlaylistRecommendation();
});

vocalSlider.noUiSlider.on('change', (values) => {
    trackRecQueryParams['min_speechiness'] = values[0];
    trackRecQueryParams['max_speechiness'] = values[1];
    fetchPlaylistRecommendation();
});

trackRecQueryParams = {
    'limit':           parseInt(numberSlider.noUiSlider.get()),
    'seed_artists':    selectedArtists.map(artist => artist.id).join(),
    'seed_tracks':     selectedTracks.map(track => track.id).join(),
    'seed_genres':     selectedGenres.map(genre => genre.id).join(),
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
