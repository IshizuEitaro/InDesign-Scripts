function applyFootnoteStyles() {

    if (app.documents.length === 0) {
        alert("Error: Please open an InDesign document before running this script.");
        return;
    }
    var doc = app.activeDocument;

    var openMarker = prompt("Enter the OPENING symbol(s) for the marker (e.g., '＊' or '(').\nLeave empty if none.", "＊");
    if (openMarker === null) return;

    var closeMarker = prompt("Enter the CLOSING symbol(s) for the marker (e.g., ')').\nLeave empty if none.", "");
    if (closeMarker === null) return;

    var footnoteStyleName = "footnote";
    var footnoteNumberStyleName = "footnote-number";

    function escapeForGrep(str) {
        if (!str) return "";
        return str.replace(/([\\()\[\]{}.*+?^$|])/g, "\\$1");
    }

    var escapedOpenMarker = escapeForGrep(openMarker);
    var escapedCloseMarker = escapeForGrep(closeMarker);

    var stylesToEnsure = [footnoteStyleName, footnoteNumberStyleName];
    for (var i = 0; i < stylesToEnsure.length; i++) {
        if (!doc.characterStyles.itemByName(stylesToEnsure[i]).isValid) {
            doc.characterStyles.add({ name: stylesToEnsure[i] });
            alert("Notice: Character style '" + stylesToEnsure[i] + "' was created.");
        }
    }
    var footnoteStyle = doc.characterStyles.itemByName(footnoteStyleName);
    var footnoteNumStyle = doc.characterStyles.itemByName(footnoteNumberStyleName);
    var processedCount = 0;

    app.findGrepPreferences = NothingEnum.NOTHING;
    app.changeGrepPreferences = NothingEnum.NOTHING;
    
    var findNumberGrep = "(?<=" + escapedOpenMarker + ")\\d+";
    if (closeMarker) {
        findNumberGrep += "(?=" + escapedCloseMarker + ")";
    }
    app.findGrepPreferences.findWhat = findNumberGrep;
    app.changeGrepPreferences.appliedCharacterStyle = footnoteNumStyle;
    var changedItems = doc.changeGrep();
    processedCount = changedItems.length;

    if (openMarker) {
        app.findGrepPreferences = NothingEnum.NOTHING;
        app.changeGrepPreferences = NothingEnum.NOTHING;
        var findOpenMarkerGrep = escapedOpenMarker + "(?=\\d+" + escapedCloseMarker + ")";
        app.findGrepPreferences.findWhat = findOpenMarkerGrep;
        app.changeGrepPreferences.appliedCharacterStyle = footnoteStyle;
        doc.changeGrep();
    }

    if (closeMarker) {
        app.findGrepPreferences = NothingEnum.NOTHING;
        app.changeGrepPreferences = NothingEnum.NOTHING;
        var findCloseMarkerGrep = "(?<=" + escapedOpenMarker + "\\d+)" + escapedCloseMarker;
        app.findGrepPreferences.findWhat = findCloseMarkerGrep;
        app.changeGrepPreferences.appliedCharacterStyle = footnoteStyle;
        doc.changeGrep();
    }

    app.findGrepPreferences = NothingEnum.NOTHING;
    app.changeGrepPreferences = NothingEnum.NOTHING;
    
    alert("Script finished.\nFound and styled " + processedCount + " footnote references.");
}

try {
    applyFootnoteStyles();
} catch (e) {
    alert("Script execution failed:\n" + e.name + ': ' + e.message);
}