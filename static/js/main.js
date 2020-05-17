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

var inputLeft = document.getElementById("input-left-energy");


// JQuery
$(document).ready(function() {

    // Clicked Search Result
    $('.list-group').on('click', '.list-group-item', function() {

        var artistName = $(this).find("p").text();

        if (selectedArtists.find(match => match.name === artistName)) {
            return;
        }

        var selectedArtist = matches.find(match => match.name == artistName);

        selectedArtists.push(selectedArtist);
        outputArtistTagsHtml();

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
