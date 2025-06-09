var doc = app.activeDocument;
// Use the active story in a selection, or the first story if nothing is selected.
var storyToProcess = doc.selection.length > 0 ? doc.selection[0].parentStory : doc.stories[0];

// Find all complete <ruby>...</ruby> blocks in the story.
app.findGrepPreferences = app.changeGrepPreferences = null;
app.findGrepPreferences.findWhat = "<ruby>[\\s\\S]+?</ruby>";
var rubyBlocks = storyToProcess.findGrep();
if (rubyBlocks.length === 0) {
    alert("No XHTML-style ruby tags found (<ruby>...</ruby>).");
    exit();
}

// Process each found block, from last to first to avoid index issues.
for (var i = rubyBlocks.length - 1; i >= 0; i--) {
    var currentBlock = rubyBlocks[i];
    var blockContent = currentBlock.contents;
    
    // Check if it's Group Ruby (one <rt>) or Mono Ruby (multiple <rt>s)
    var rt_count = (blockContent.match(/<rt>/g) || []).length;

    if (rt_count === 1) {
        // --- HANDLE GROUP RUBY ---
        var parentFindGrep = "";
        if (blockContent.indexOf("<rb>") > -1) {
            parentFindGrep = "(?<=<rb>).+?(?=</rb>)";
        } else {
            parentFindGrep = "(?<=<ruby>).+?(?=<rt>)";
        }
        app.findGrepPreferences.findWhat = parentFindGrep;
        var parentChar = currentBlock.findGrep();
        
        app.findGrepPreferences.findWhat = "(?<=<rt>).+?(?=</rt>)";
        var rubyChar = currentBlock.findGrep();

        if (parentChar.length === 0 || rubyChar.length === 0) { continue; }

        parentChar[0].properties = {
            rubyFlag: true,
            rubyString: rubyChar[0].contents, 
            rubyType: RubyTypes.GROUP_RUBY
        };

    } else if (rt_count > 1) {
        // --- HANDLE MONO RUBY ---
        app.findGrepPreferences.findWhat = "(?<=<rb>).+?(?=</rb>)";
        var parents = currentBlock.findGrep();
        app.findGrepPreferences.findWhat = "(?<=<rt>).+?(?=</rt>)";
        var rubies = currentBlock.findGrep();

        if (parents.length > 0 && parents.length === rubies.length) {
            for (var j = parents.length - 1; j >= 0; j--) {
                parents[j].properties = {
                    rubyFlag: true,
                    rubyString: rubies[j].contents,
                    rubyType: RubyTypes.PER_CHARACTER_RUBY
                };
            }
        }
    }

    // --- CLEANUP ---
    app.findGrepPreferences.findWhat = "(<rt>[\\s\\S]+?</rt>)|<[^>]+>";
    app.changeGrepPreferences.changeTo = "";
    currentBlock.changeGrep();
}

app.findGrepPreferences = app.changeGrepPreferences = null;
alert("Ruby processing complete.");