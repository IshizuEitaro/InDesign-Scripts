Array.prototype.indexOf = function ( item ) {
var index = 0, length = this.length;
for ( ; index < length; index++ ) {
        if ( this[index] === item )
                    return index;
    }
    return -1;
};

function convertSpanToCharacterStyle() {

    if (app.documents.length === 0) {
        alert("Error: Please open an InDesign document before running this script.");
        return;
    }
    var doc = app.activeDocument;
    var missingStyles = []; 

    var grepPattern = '<span\\s+class=["”]([^"”]+)["”]>([\\s\\S]+?)<\\/span>';

    app.findGrepPreferences = null; 
    app.findGrepPreferences.findWhat = grepPattern;

    var finds = doc.findGrep();

    if (finds.length === 0) {
        alert("No <span class='...'> tags were found in the document.");
        return;
    }

    for (var i = finds.length - 1; i >= 0; i--) {
        var foundItem = finds[i];
        
        var match = foundItem.contents.match(/<span\s+class=["”]([^"”]+)["”]>([\s\S]+?)<\/span>/);

        if (match && match[1] && match[2]) {
            var styleName = match[1]; // e.g., "em-sesame"
            var innerText = match[2];

            var charStyle = doc.characterStyles.item(styleName);

            if (charStyle.isValid) {
                foundItem.contents = innerText;
                foundItem.applyCharacterStyle(charStyle, false);
            } else {
                
                if (missingStyles.indexOf(styleName) === -1) {
                    missingStyles.push(styleName);
                }
            }
        }
    }
    
    app.findGrepPreferences = null;

    var finalMessage = "Process completed!\n\n" + (finds.length) + " tag(s) processed.";
    
    if (missingStyles.length > 0) {
        finalMessage += "\n\nThe following Character Styles were not found and were skipped:\n- " + missingStyles.join("\n- ");
    }
    
    alert(finalMessage);
}

try {
    convertSpanToCharacterStyle();
} catch (e) {
    alert("An unexpected error occurred: " + e.message);
}