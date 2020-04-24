
/** GLOBALS */

// Declare a reference to the overall score guage
let overallScoreGauge;

// Declare a reference to the word - alternate map
// e.g. { 'love': ['hate', 'despise', ...] } for antonyms
// e.g. { 'love': ['like', 'enjoy', ...] } for synonyms
let wordAlternatemMap = {};

// Instantiate the Rich Text editor
tinymce.init({
    selector: '#editor',
    plugins: [ 'quickbars' ],
    toolbar: false,
    menubar: false,
    statusbar: false,
    setup: function(editor) {
    editor.on('init', function(e) {
      // Append our stylesheet to iframe
        const cssLink = document.createElement("link");
        cssLink.href = "../static/css/editor.css"; 
        cssLink.rel = "stylesheet"; 
        cssLink.type = "text/css"; 
        document.getElementById('editor_ifr').contentDocument.head.appendChild(cssLink);
    });

    editor.on('SetContent', addTaggedWordListener);
  }
});


/** Fetch the analysis */
function onFetchAnalysis() {
    const html               = tinyMCE.activeEditor.getContent();
    const essayText          = $(html).text();
    const sentimentChoiceEls = document.getElementsByName('sentiment');
    let desiredSentiment;

    sentimentChoiceEls.forEach(el => {
        if (el.checked) {
            desiredSentiment = el.value;
        }
    });
    
    // Make the essay analysis
    $.post('https://essayist-csuf.herokuapp.com/get_essay_analysis', { essay_text: essayText, desired_sentiment: desiredSentiment })
    .done(result => parseAnalysis(result))
    .fail(err => {
        console.log('error =', err.status);
    });
}

/** Parse the analysis. */
function parseAnalysis(analysis) {
    const { sentences, overall_score } = analysis;

    // Reset any existing analysis
    reset();

    // Update the overall sentiment
    updateOverallAnalysis(overall_score);

    // 
    wordAlternatemMap = analysis.tagged_words;

    // Set the text in the editor
    tinyMCE.activeEditor.setContent(analysis.text);

    // Show the antonym hint
    $('#alternatesHint').attr('hidden', false);
}

/** Update the overall analysis guage and sentiment text */
function updateOverallAnalysis(score) {
    let sentimentText;

    if (score >= 70) { sentimentText = 'very positive'; }
    else if (score >= 30) { sentimentText = 'positive'; }
    else if (score >= 10) { sentimentText = 'somewhat positive'; }
    else if (score >= -10) { sentimentText = 'neutral'; }
    else if (score <= -70) { sentimentText = 'very negative'; }
    else if (score <= -30) { sentimentText = 'negative'; }
    else { sentimentText = 'somewhat negative' }


    // Update the sentiment text
    const sentimentEl = $('.overall-sentiment-value');
    sentimentEl.text(sentimentText);
    sentimentEl.addClass(score > 10 ? 'positive' : score > -10 ? 'neutral' : 'negative');

    // Show the sentiment text
    $('.sentiment-text').attr('hidden', false);


    // Update the score on the overall sentiment gauge
    if (!overallScoreGauge) {
        overallScoreGauge = new JustGage({
            id: "gauge",
            value: score,
            min: -100,
            max: 100,
            minTxt: 'Negative',
            maxTxt: 'Positive',
            hideValue: true,
            levelColorsGradient: true,
            levelColors: ["#ff0000", "#f9c802", "#a9d70b"]
        });
    } else {
        overallScoreGauge.refresh(score);
    }
}

/** 
 * Add click handlers to the tagged words. When the word is clicked,
 * update the antonym container with the word's antonyms.
 */
function addTaggedWordListener(editor) {
    const doc         = editor.target.iframeElement.contentDocument;
    const taggedWords = doc.querySelectorAll(['.opposite-tone-word', '.match-tone-word']);

    for(let i = 0; i < taggedWords.length; i++) {
        taggedWords[i].addEventListener("click", function(evt) {
            updateAlternativesContainer(evt);
        });
    }
}

/** Append the clicked word's antonyms to the antonym container */
function updateAlternativesContainer(evt) {
    const word         = evt.target.innerText;
    const alternates   = wordAlternatemMap[word];
    const alternatesCt = $('#alternativesContainer');

    // Clear current alternates
    alternatesCt.empty();

    // Indicate that we're displaying a list of synonyms
    if (evt.target.classList.value === 'match-tone-word') {
        $('#alternativeTitle').text('Synonyms');
    } else {
        $('#alternativeTitle').text('Antonyms');
    }

    // Show the alternates hint
    $('#alternatesHint').attr('hidden', false);

    // Append each alternate to the alternate container
    for (alternate of alternates) {
        alternatesCt.append(`<div class="alternate">${alternate}</div>`);
    }

    const alternateEls = document.getElementsByClassName('alternate');

    for(let i = 0; i < alternateEls.length; i++) {
        alternateEls[i].addEventListener("click", function(alternateEvt) {
            replaceText(alternateEvt, evt);
        });
    }
}

/**
 * Handler for clicking an antonym. On click, replace the tagged word in the editor
 * with the antonym.
 */
function replaceText(alternateEvt, originalTextEvt) {
    const antonym = alternateEvt.target.innerText;
    const wordEl  = originalTextEvt.target;

    // Remove the highlight from the word
    wordEl.removeAttribute('class');

    // Replace the word
    wordEl.innerText = antonym;
}

/** Reset the form to a pre-analysis state */
function reset() {
    const sentimentText = $('.sentiment-text');
    const sentimentEl   = $('.overall-sentiment-value');
    const alternatesCt  = $('#alternativesContainer');

    sentimentText.attr('hidden', true);

    $('#alternativeTitle').text('Alternatives');

    // Hide the antonym hint
    $('#alternatesHint').attr('hidden', false);

    alternatesCt.empty();

    sentimentEl.removeClass(['positive', 'neutral', 'negative']);
    sentimentEl.text('');
}

