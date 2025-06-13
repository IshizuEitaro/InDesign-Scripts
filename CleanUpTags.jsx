function removeAllHtmlTags() {

    if (app.documents.length === 0) {
        alert("Error: No document is open. Please open a document and try again.");
        return;
    }
    var doc = app.activeDocument;

    var userResponse = confirm("Are you sure you want to remove ALL XHTML/HTML tags from the entire document?\nThis action cannot be undone. It is recommended to save a backup of your document first.");
    if (!userResponse) {
        alert("Operation cancelled.");
        return;
    }

    try {
        app.findGrepPreferences = NothingEnum.NOTHING;
        app.changeGrepPreferences = NothingEnum.NOTHING;

        app.findGrepPreferences.findWhat = "<[^>]+>";

        app.changeGrepPreferences.changeTo = "";

        doc.changeGrep();

        app.findGrepPreferences = NothingEnum.NOTHING;
        app.changeGrepPreferences = NothingEnum.NOTHING;

        alert("Cleanup complete! All tags have been removed.");

    } catch (e) {
        alert("An unexpected error occurred:\n" + e.name + ': ' + e.message + "\nLine: " + e.line);
    }
}

try {
    removeAllHtmlTags();
} catch (e) {
    alert("Script execution failed:\n" + e.name + ': ' + e.message);
}