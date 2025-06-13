function convertLinksToFootnotes() {

    if (app.documents.length === 0) {
        alert("Error: No document is open. Please open a document and try again.");
        return;
    }
    var doc = app.activeDocument;

    var linkClassName = prompt("Enter the class name for the footnote links:", "notes", "Footnote Link Class");
    if (!linkClassName) {
        return;
    }

    var stylesToEnsure = ["footnote", "footnote-number"];
    for (var i = 0; i < stylesToEnsure.length; i++) {
        if (!doc.characterStyles.itemByName(stylesToEnsure[i]).isValid) {
            doc.characterStyles.add({ name: stylesToEnsure[i] });
            alert("Notice: Character style '" + stylesToEnsure[i] + "' was created.");
        }
    }
    var footnoteCharStyle = doc.characterStyles.itemByName("footnote");
    var footnoteNumberStyle = doc.characterStyles.itemByName("footnote-number");

    var tasks = [];
    app.findGrepPreferences = NothingEnum.NOTHING;
    app.changeGrepPreferences = NothingEnum.NOTHING;

    app.findGrepPreferences.findWhat = '<a\\s+[^>]*?class\\s*=\\s*["“”]' + linkClassName + '["“”][^>]*?>.*?<\\/a>';
    var foundLinks = doc.findGrep();

    if (foundLinks.length === 0) {
        alert("Operation stopped: No links found with class '" + linkClassName + "'.");
        return;
    }

    alert("Found " + foundLinks.length + " links. Matching them to their footnote content...");

    for (var j = 0; j < foundLinks.length; j++) {
        var aLink = foundLinks[j];
        if (!aLink.isValid) continue;

        var linkHTML = aLink.contents;
        var hrefMatch = linkHTML.match(/href\s*=\s*["“”][^#]+#(.*?)["“”]/);

        if (hrefMatch && hrefMatch[1]) {
            var footnoteContentID = hrefMatch[1];

            app.findGrepPreferences = NothingEnum.NOTHING;
            app.findGrepPreferences.findWhat = '<p\\b[^>]*>.*?<a\\s+[^>]*?id\\s*=\\s*["“”]' + footnoteContentID + '["“”][^>]*?>(.*?)<\\/a>(.*?)<\\/p>';
            var foundContent = doc.findGrep();

            if (foundContent.length > 0) {
                tasks.push({
                    linkObject: aLink,
                    contentParagraph: foundContent[0].paragraphs[0]
                });
            } else {
                alert("Warning: Could not find content for ID: #" + footnoteContentID + ". Skipping.");
            }
        }
    }

    if (tasks.length === 0) {
        alert("No valid link-and-content pairs found.");
        return;
    }

    alert(tasks.length + " valid task(s) created. Starting conversion...");
    var processedCount = 0;
    var paragraphsToDelete = []; 

    for (var k = tasks.length - 1; k >= 0; k--) {
        var currentTask = tasks[k];
        var linkToProcess = currentTask.linkObject;
        var paraToProcess = currentTask.contentParagraph;

        if (!linkToProcess.isValid || !paraToProcess.isValid) {
            continue;
        }
        
        var rawFootnoteHtml = paraToProcess.contents;
        paragraphsToDelete.push(paraToProcess.contents);

        var fullLinkHtml = linkToProcess.contents;
        var innerHtml = fullLinkHtml.replace(/^<a\s+[^>]*?>/i, "").replace(/<\/a>$/i, "");
        linkToProcess.contents = innerHtml;

        app.findGrepPreferences = NothingEnum.NOTHING;
        
        app.findGrepPreferences.findWhat = "[^一-龯ぁ-んァ-ン\\w]";
        var symbolResult = linkToProcess.findGrep();
        if (symbolResult.length > 0) {
            for (var s = 0; s < symbolResult.length; s++) {
                symbolResult[s].appliedCharacterStyle = footnoteCharStyle;
            }
        }

        app.findGrepPreferences.findWhat = "(\\d+)";
        var numberResult = linkToProcess.findGrep();

        if (numberResult.length > 0) {
            var numberObject = numberResult[0];
            numberObject.appliedCharacterStyle = footnoteNumberStyle;

            var insertionPoint = numberObject.insertionPoints[-1];
            var newFootnote = insertionPoint.footnotes.add();
            newFootnote.texts[0].contents = rawFootnoteHtml;
        } else {
            var fallbackFootnote = linkToProcess.insertionPoints[-1].footnotes.add();
            fallbackFootnote.texts[0].contents = rawFootnoteHtml;
        }

        processedCount++;
    }

    for (var m = paragraphsToDelete.length - 1; m >= 0; m--) {
        var paraContents = paragraphsToDelete[m];
        var foundParas = doc.stories.everyItem().paragraphs.everyItem().getElements();
        var foundPara = null;
        for (var n = 0; n < foundParas.length; n++) {
            if (foundParas[n].contents === paraContents) {
                foundPara = foundParas[n];
                break;
            }
        }
        if (foundPara && foundPara.isValid) {
            foundPara.remove();
        } else {
            alert("Paragraph was not valid or not found at deletion time:\n" + paraContents);
        }
    }

    app.findGrepPreferences = NothingEnum.NOTHING;
    app.changeGrepPreferences = NothingEnum.NOTHING;

    alert("Conversion complete!\n" + processedCount + " footnote(s) were successfully created.");
}

try {
    convertLinksToFootnotes();
} catch (e) {
    alert("An unexpected error occurred:\n" + e.name + ': ' + e.message + "\nLine: " + e.line);
}