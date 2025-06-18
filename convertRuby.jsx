var doc = app.activeDocument;
var allStories = doc.stories;

if (allStories.length === 0) {
    alert("No stories found in the document.");
    exit();
}

var rubyFoundInDocument = false;

for (var s = 0; s < allStories.length; s++) {
    var storyToProcess = allStories[s];

    try {
        app.findGrepPreferences = app.changeGrepPreferences = null;
        app.findGrepPreferences.findWhat = "<ruby>[\\s\\S]+?</ruby>";
        var rubyBlocks = storyToProcess.findGrep();
        
        if (rubyBlocks.length > 0) {
            rubyFoundInDocument = true;
        } else {
            continue;
        }

        for (var i = rubyBlocks.length - 1; i >= 0; i--) {
            var currentBlock = rubyBlocks[i];
            var blockContent = currentBlock.contents;
            
            var rt_count = (blockContent.match(/<rt>/g) || []).length;

            if (rt_count === 1) {
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

            app.findGrepPreferences.findWhat = "(<rt>[\\s\\S]+?</rt>)|<[^>]+>";
            app.changeGrepPreferences.changeTo = "";
            currentBlock.changeGrep();
        }
    } catch(e) {
        $.writeln("An error occurred in story " + s + ": " + e.message);
    }
}

app.findGrepPreferences = app.changeGrepPreferences = null;

if (rubyFoundInDocument) {
    alert("Ruby processing complete for the entire document.");
} else {
    alert("No XHTML-style ruby tags found (<ruby>...</ruby>) in the entire document.");
}