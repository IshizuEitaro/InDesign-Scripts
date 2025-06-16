// Creates footnotes while preserving original markers and avoiding the definition page.

function createFootnotesFromText() {
    if (app.documents.length === 0) {
        alert("Error: No document is open. Please open a document and try again.");
        return;
    }
    var doc = app.activeDocument;

    // --- USER INPUT ---
    var openMarker = prompt("Enter the OPENING symbol(s) for the marker (e.g., '(' or '＊').\nLeave empty if none.", "(");
    if (openMarker === null) return;

    var closeMarker = prompt("Enter the CLOSING symbol(s) for the marker (e.g., ')').\nLeave empty if none.", ")");
    if (closeMarker === null) return;

    // --- NEW PROMPT FOR DEFINITION PAGE ---
    var defStartPage = prompt("To avoid errors, enter the page number where your DEFINITION list begins:", "10");
    if (defStartPage === null || isNaN(parseInt(defStartPage))) {
        alert("Invalid page number. Aborting script.");
        return;
    }
    var defStartPageNum = parseInt(defStartPage, 10);

    // --- SETUP ---
    function escapeForGrep(str) {
        if (!str) return "";
        return str.replace(/([\\()\[\]{}.*+?^$|])/g, "\\$1");
    }

    var escapedOpenMarker = escapeForGrep(openMarker);
    var escapedCloseMarker = escapeForGrep(closeMarker);
    
    app.findGrepPreferences = NothingEnum.NOTHING;
    app.changeGrepPreferences = NothingEnum.NOTHING;

    // --- STEP 1: GATHER ALL DEFINITIONS ---
    var definitions = {};
    var paragraphsToDelete = [];

    // This GREP finds the number and the text separately.
    app.findGrepPreferences.findWhat = "^" + escapedOpenMarker + "(\\d+)" + escapedCloseMarker + "(\\s+.+)";
    var foundDefinitions = doc.findGrep();

    if (foundDefinitions.length === 0) {
        alert("Operation stopped: No definition paragraphs found matching the pattern '" + openMarker + "[number]" + closeMarker + "'.");
        return;
    }

    alert("Found " + foundDefinitions.length + " definitions. Storing them now.");
    for (var i = 0; i < foundDefinitions.length; i++) {
        var aDef = foundDefinitions[i];
        if (aDef.contents.toString().match(app.findGrepPreferences.findWhat)) {
            var number = RegExp.$1;
            var text = RegExp.$2;
            // --- NEW: Store the ENTIRE definition line, including the marker ---
            definitions[number] = openMarker + number + closeMarker + text;
            paragraphsToDelete.push(aDef.paragraphs[0]);
        }
    }

    // --- STEP 2: FIND MARKERS IN MAIN TEXT AND CREATE FOOTNOTES ---
    var processedCount = 0;
    
    var keysArray = [];
    for (var key in definitions) {
        if (definitions.hasOwnProperty(key)) { keysArray.push(key); }
    }
    var sortedKeys = keysArray.sort(function(a, b) { return parseInt(b, 10) - parseInt(a, 10); });

    alert("Starting to convert " + sortedKeys.length + " markers found before page " + defStartPageNum + "...");
    for (var i = 0; i < sortedKeys.length; i++) {
        var number = sortedKeys[i];
        var definitionText = definitions[number];

        app.findGrepPreferences = NothingEnum.NOTHING;
        app.findGrepPreferences.findWhat = escapedOpenMarker + number + escapedCloseMarker;
        var foundMarkers = doc.findGrep();

        for (var j = foundMarkers.length - 1; j >= 0; j--) {
            var aMarker = foundMarkers[j];
            if (!aMarker.isValid) continue;

            // --- NEW: CHECK THE PAGE NUMBER OF THE MARKER ---
            try {
                // Find the page the marker is on.
                var markerPage = aMarker.parentTextFrames[0].parentPage;
                if (markerPage === null || parseInt(markerPage.name) >= defStartPageNum) {
                    // If it's on or after the definition page, skip it.
                    continue;
                }
            } catch (e) {
                // Could fail if marker is in overset text. Skip it.
                continue;
            }
            
            // --- MODIFIED: Insert footnote, but DO NOT remove the original marker ---
            var newFootnote = aMarker.insertionPoints[0].footnotes.add();
            newFootnote.texts[0].contents = definitionText;
            
            processedCount++;
        }
    }

    // --- STEP 3: CLEAN UP DEFINITION PARAGRAPHS ---
    for (var i = paragraphsToDelete.length - 1; i >= 0; i--) {
        if (paragraphsToDelete[i].isValid) {
            paragraphsToDelete[i].remove();
        }
    }
    
    // --- FINALIZATION ---
    app.findGrepPreferences = NothingEnum.NOTHING;
    app.changeGrepPreferences = NothingEnum.NOTHING;
    alert("Conversion complete!\n" + processedCount + " footnote(s) were successfully created.");
}

// --- RUN THE SCRIPT ---
try {
    createFootnotesFromText();
} catch (e) {
    alert("An unexpected error occurred:\n" + e.name + ': ' + e.message + "\nLine: " + e.line);
}