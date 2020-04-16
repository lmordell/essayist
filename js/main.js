
/** GLOBALS */

// Declare a reference to the overall score guage
let overallScoreGauge;

// Declare a reference to the word - antonym map
// e.g. { 'love': ['hate', 'despise', ...] }
let wordAntonymMap = {};

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
        cssLink.href = "../css/editor.css"; 
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
    $.post('http://localhost:5000/get_essay_analysis', { essay_text: essayText, desired_sentiment: desiredSentiment })
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
    wordAntonymMap = analysis.tagged_words;

    // Set the text in the editor
    tinyMCE.activeEditor.setContent(analysis.text);

    // Show the antonym hint
    $('#antonymHint').attr('hidden', false);
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
    const taggedWords = doc.getElementsByClassName('tagged-word');

    for(let i = 0; i < taggedWords.length; i++) {
        taggedWords[i].addEventListener("click", function(evt) {
            updateAntonymContainer(evt);
        });
    }
}

/** Append the clicked word's antonyms to the antonym container */
function updateAntonymContainer(evt) {
    const word      = evt.target.innerText;
    const antonyms  = wordAntonymMap[word];
    const antonymCt = $('#antonymContainer');

    // Clear current antonyms
    antonymCt.empty();

    // Show the antonym hint
    $('#antonymHint').attr('hidden', false);

    // Append each antonym to the antonym container
    for (antonym of antonyms) {
        antonymCt.append(`<div class="antonym">${antonym}</div>`);
    }

    const antonymEls = document.getElementsByClassName('antonym');

    for(let i = 0; i < antonymEls.length; i++) {
        antonymEls[i].addEventListener("click", function(antonymEvt) {
            replaceText(antonymEvt, evt);
        });
    }
}

/**
 * Handler for clicking an antonym. On click, replace the tagged word in the editor
 * with the antonym.
 */
function replaceText(antonymEvt, originalTextEvt) {
    const antonym = antonymEvt.target.innerText;
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
    const antonymCt     = $('#antonymContainer');

    sentimentText.attr('hidden', true);

    // Hide the antonym hint
    $('#antonymHint').attr('hidden', false);

    antonymCt.empty();

    sentimentEl.removeClass(['positive', 'neutral', 'negative']);
    sentimentEl.text('');
}

