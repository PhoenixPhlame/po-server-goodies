exports.handleCommand = function(src, command, commandData, tar) {
    // d lolz
    cmd_d = sys.read("d.txt");
    // loop indices
    var i, x;
    // temp array
    var ar;
    if (command == "commandlist") {
        if (commandData === undefined) {
            sendChanMessage(src, "*** Commands ***");
            for (x = 0; x < this.help.length; ++x) {
                sendChanMessage(src, this.help[x]);
            }
            sendChanMessage(src, "*** Other Commands ***");
            sendChanMessage(src, "/commands channel: To know of channel commands");
            if (sys.auth(src) > 0) {
                sendChanMessage(src, "/commands mod: To know of moderator commands");
            }
            if (sys.auth(src) > 1) {
                sendChanMessage(src, "/commands admin: To know of admin commands");
            }
            if (sys.auth(src) > 2 || isSuperAdmin(src)) {
                sendChanMessage(src, "/commands owner: To know of owner commands");
            }
            var pluginhelps = getplugins("help-string");
            for (var module in pluginhelps) {
                if (pluginhelps.hasOwnProperty(module)) {
                    var help = typeof pluginhelps[module] == "string" ? [pluginhelps[module]] : pluginhelps[module];
                    for (i = 0; i < help.length; ++i)
                        sendChanMessage(src, "/commands " + help[i]);
                }
            }
            return;
        }

        commandData = commandData.toLowerCase();
        if ( (commandData == "mod" && sys.auth(src) > 0)
            || (commandData == "admin" && sys.auth(src) > 1)
            || (commandData == "owner" && (sys.auth(src) > 2  || isSuperAdmin(src)))
            || (commandData == "channel") ) {
            sendChanMessage(src, "*** " + commandData.toUpperCase() + " Commands ***");
            require(commandData+"commands.js").help.forEach(function(help) {
                sendChanMessage(src, help);
            });
        }
        callplugins("onHelp", src, commandData, channel);

        return;
    }
    if ((command == "me" || command == "rainbow") && !SESSION.channels(channel).muteall) {
        if (SESSION.channels(channel).meoff === true) {
            normalbot.sendChanMessage(src, "/me was turned off.");
            return;
        }
        if (commandData === undefined)
            return;
        if (channel == sys.channelId("Trivia") && SESSION.channels(channel).triviaon) {
            sys.sendMessage(src, "±Trivia: Answer using \\a, /me not allowed now.", channel);
            return;
        }
        if (usingBannedWords() || repeatingOneself() || capsName()) {
            sys.stopEvent();
            return;
        }
        if (SESSION.users(src).smute.active) {
            sys.playerIds().forEach(function(id) {
                if (sys.loggedIn(id) && SESSION.users(id).smute.active && sys.isInChannel(src, channel)) {
                    var colour = script.getColor(src);
                    sys.sendHtmlMessage(id, "<font color='"+colour+"'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> " + commandData + "</font>", channel);
                }
            });
            sys.stopEvent();
            script.afterChatMessage(src, '/'+command+ ' '+commandData,channel);
            return;
        }
        SESSION.channels(channel).beforeMessage(src, "/me " + commandData);
        commandData=utilities.html_escape(commandData);
        var messagetosend = commandData;
        if (typeof CAPSLOCKDAYALLOW != 'undefined' && CAPSLOCKDAYALLOW === true) {
            var date = new Date();
            if ((date.getDate() == 22 && date.getMonth() == 9) || (date.getDate() == 28 && date.getMonth() == 5)) { // October 22nd & June 28th
                messagetosend = messagetosend.toUpperCase();
            }
        }
        if (command == "me") {
            var colour = script.getColor(src);
            sendChanHtmlAll("<font color='" + colour + "'><timestamp/> *** <b>" + utilities.html_escape(sys.name(src)) + "</b> " + messagetosend + "</font>", channel);
        }
        else if (command == "rainbow" && SESSION.global().allowRainbow && channel !== 0 && channel !== tourchannel && channel !== mafiachan && channel != sys.channelId("Trivia")) {
            var auth = 1 <= sys.auth(src) && sys.auth(src) <= 3;
            var colours = ["#F85888", "#F08030", "#F8D030", "#78C850", "#98D8D8", "#A890F0", "#C183C1"];
            var colour = sys.rand(0, colours.length);
            var randColour = function () {
                var returnVal = colours[colour];
                colour = colour + 1;
                if (colour === colours.length) {
                    colour = 0;
                }
                return returnVal;
            };
            var toSend = ["<timestamp/><b>"];
            if (auth) toSend.push("<span style='color:" + randColour() + "'>+</span><i>");
            var name = sys.name(src);
            for (var j = 0; j < name.length; ++j)
                toSend.push("<span style='color:" + randColour() + "'>" + utilities.html_escape(name[j]) + "</span>");
            toSend.push("<span style='color:" + randColour() + "'>:</b></span> ");
            if (auth) toSend.push("</i>");
            toSend.push(messagetosend);
            sendChanHtmlAll(toSend.join(""), channel);
        }
        script.afterChatMessage(src, '/' + command + ' ' + commandData, channel);
        return;
    }
    if (command == "contributors") {
        sendChanMessage(src, "");
        sendChanMessage(src, "*** CONTRIBUTORS ***");
        sendChanMessage(src, "");
        for (var x in contributors.hash) {
            if (contributors.hash.hasOwnProperty(x)) {
                sendChanMessage(src, x + "'s contributions: " + contributors.get(x));
            }
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "league") {
        if (!Config.League) return;
        sendChanMessage(src, "");
        sendChanMessage(src, "*** Pokemon Online League ***");
        sendChanMessage(src, "");
        ar = Config.League;
        for (x = 0; x < ar.length; ++x) {
            if (ar[x].length > 0) {
                sys.sendHtmlMessage(src, "<span style='font-weight: bold'>" + utilities.html_escape(ar[x][0]) + "</span> - " + ar[x][1].format(utilities.html_escape(ar[x][0])) + " " + (sys.id(ar[x][0]) !== undefined ? "<span style='color: green'>(online)</span>" : "<span style='color: red'>(offline)</span>"), channel);
            }
        }
        sendChanMessage(src, "");
        return;
    }
    if (command == "rules") {
        if (commandData === "mafia") {
            require('mafia.js').showRules(src, commandData, channel);
            return;
        }
        var norules = (rules.length-1)/2; //formula for getting the right amount of rules
        if(commandData !== undefined && !isNaN(commandData) && commandData >0 && commandData < norules){
            var num = parseInt(commandData, 10);
            num = (2*num)+1; //gets the right rule from the list since it isn't simply y=x it's y=2x+1
            sendChanMessage(src, rules[num]);
            sendChanMessage(src, rules[num+1]);
            return;
        }
        for (var rule = 0; rule < rules.length; rule++) {
            sendChanMessage(src, rules[rule]);
        }
        return;
    }
    if (command == "players") {
        if (commandData) {
            commandData = commandData.toLowerCase();
        }
        if (["windows", "linux", "android", "mac", "webclient"].indexOf(commandData) !== -1) {
            var android = 0;
            sys.playerIds().forEach(function (id) {
                if (sys.os(id) === commandData) {
                    android += 1;
                }
            });
            countbot.sendMessage(src, "There are  " + android + " " + commandData + " players online", channel);
            return;
        }
        countbot.sendChanMessage(src, "There are " + sys.numPlayers() + " players online.");
        return;
    }
    if (command == "ranking") {
        var announceTier = function(tier) {
            var rank = sys.ranking(sys.name(src), tier);
            if (rank === undefined) {
                rankingbot.sendChanMessage(src, "You are not ranked in " + tier + " yet!");
            } else {
                rankingbot.sendChanMessage(src, "Your rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ladderRating(src, tier) + " points / " + sys.ratedBattles(sys.name(src), tier) +" battles]!");
            }
        };
        if (commandData !== undefined) {
            if (sys.totalPlayersByTier(commandData) === 0)
                rankingbot.sendChanMessage(src, commandData + " is not even a tier.");
            else
                announceTier(commandData);
        } else {
            [0,1,2,3,4,5].slice(0, sys.teamCount(src))
                .map(function(i) { return sys.tier(src, i); })
                .filter(function(tier) { return tier !== undefined; })
                .sort()
                .filter(function(tier, index, array) { return tier !== array[index-1]; })
                .forEach(announceTier);
        }
        return;
    }
    if (command == "battlecount") {
        if (!commandData || commandData.indexOf(":") == -1) {
            rankingbot.sendChanMessage(src, "Usage: /battlecount name:tier");
            return;
        }
        var stuff = commandData.split(":");
        var name = stuff[0];
        var tier = stuff[1];
        var rank = sys.ranking(name, tier);
        if (rank === undefined) {
            rankingbot.sendChanMessage(src, "They are not ranked in " + tier + " yet!");
        } else {
            rankingbot.sendChanMessage(src, name + "'s rank in " + tier + " is " + rank + "/" + sys.totalPlayersByTier(tier) + " [" + sys.ratedBattles(name, tier) +" battles]!");
        }
        return;
    }
    if (command == "auth") {
        var DoNotShowIfOffline = ["loseyourself", "oneballjay"];
        var filterByAuth = function(level) { return function(name) { return sys.dbAuth(name) == level; }; };
        var printOnlineOffline = function(name) {
            if (sys.id(name) === undefined) {
                if (DoNotShowIfOffline.indexOf(name) == -1) sys.sendMessage(src, name + " (Offline)", channel);
            } else {
                sys.sendHtmlMessage(src, '<timestamp/><font color = "green">' + name.toCorrectCase() + ' (Online)</font>', channel);
            }
        };
        var authlist = sys.dbAuths().sort();
        sendChanMessage(src, "");
        switch (commandData) {
        case "owners":
            sys.sendMessage(src, "*** Owners ***", channel);
            authlist.filter(filterByAuth(3)).forEach(printOnlineOffline);
            break;
        case "admins":
        case "administrators":
            sys.sendMessage(src, "*** Administrators ***", channel);
            authlist.filter(filterByAuth(2)).forEach(printOnlineOffline);
            break;
        case "mods":
        case "moderators":
            sys.sendMessage(src, "*** Moderators ***", channel);
            authlist.filter(filterByAuth(1)).forEach(printOnlineOffline);
            break;
        default:
            sys.sendMessage(src, "*** Owners ***", channel);
            authlist.filter(filterByAuth(3)).forEach(printOnlineOffline);
            sys.sendMessage(src, '', channel);
            sys.sendMessage(src, "*** Administrators ***", channel);
            authlist.filter(filterByAuth(2)).forEach(printOnlineOffline);
            sys.sendMessage(src, '', channel);
            sys.sendMessage(src, "*** Moderators ***", channel);
            authlist.filter(filterByAuth(1)).forEach(printOnlineOffline);
        }
        sys.sendMessage(src, '', channel);
        return;
    }
    if (command == "sametier") {
        if (commandData == "on") {
            battlebot.sendChanMessage(src, "You enforce same tier in your battles.");
            SESSION.users(src).sametier = true;
        } else if (commandData == "off") {
            battlebot.sendChanMessage(src, "You allow different tiers in your battles.");
            SESSION.users(src).sametier = false;
        } else {
            battlebot.sendChanMessage(src, "Currently: " + (SESSION.users(src).sametier ? "enforcing same tier" : "allow different tiers") + ". Use /sametier on/off to change it!");
        }
        saveKey("forceSameTier", src, SESSION.users(src).sametier * 1);
        return;
    }
    if (command == "idle") {
        if (commandData == "on") {
            battlebot.sendChanMessage(src, "You are now idling.");
            saveKey("autoIdle", src, 1);
            sys.changeAway(src, true);
        } else if (commandData == "off") {
            battlebot.sendChanMessage(src, "You are back and ready for battles!");
            saveKey("autoIdle", src, 0);
            sys.changeAway(src, false);
        } else {
            battlebot.sendChanMessage(src, "You are currently " + (sys.away(src) ? "idling" : "here and ready to battle") + ". Use /idle on/off to change it.");
        }
        return;
    }
    if (command == "selfkick" || command == "sk") {
        var src_ip = sys.ip(src);
        var players = sys.playerIds();
        var players_length = players.length;
        for (var i = 0; i < players_length; ++i) {
            var current_player = players[i];
            if ((src != current_player) && (src_ip == sys.ip(current_player))) {
                sys.kick(current_player);
                normalbot.sendMessage(src, "Your ghost was kicked...");
            }
        }
        return;
    }
    if (command == "topic") {
        SESSION.channels(channel).setTopic(src, commandData);
        return;
    }
    if (command == "topicadd") {
        if (SESSION.channels(channel).topic.length > 0)
            SESSION.channels(channel).setTopic(src, SESSION.channels(channel).topic + Config.topic_delimiter + commandData);
        else
            SESSION.channels(channel).setTopic(src, commandData);
        return;
    }
    if (command == "removepart") {
        var topic = SESSION.channels(channel).topic;
        topic = topic.split(Config.topic_delimiter);
        if (isNaN(commandData) || commandData > topic.length) {
            return;
        }
        var part = commandData;
        if (part > 0) {
            part = part -1;
        }
        topic.splice(part, 1);
        SESSION.channels(channel).setTopic(src, topic.join(Config.topic_delimiter));
        return;
    }
    if (command == "updatepart") {
        var topic = SESSION.channels(channel).topic;
        topic = topic.split(Config.topic_delimiter);
        var pos = commandData.indexOf(" ");
        if (pos === -1) {
            return;
        }
        if (isNaN(commandData.substring(0, pos)) || commandData.substring(0, pos) - 1 < 0 || commandData.substring(0, pos) - 1 > topic.length - 1) {
            return;
        }
        topic[commandData.substring(0, pos) - 1] = commandData.substr(pos+1);
        SESSION.channels(channel).setTopic(src, topic.join(Config.topic_delimiter));
        return;
    }
    if (command == "uptime") {
        if (typeof(script.startUpTime()) != "string") {
            countbot.sendChanMessage(src, "Somehow the server uptime is messed up...");
            return;
        }
        countbot.sendChanMessage(src, "Server uptime is "+script.startUpTime());
        return;
    }
    if (command == "resetpass") {
        if (!sys.dbRegistered(sys.name(src))) {
            normalbot.sendChanMessage(src, "You are not registered!");
            return;
        }
        sys.clearPass(sys.name(src));
        normalbot.sendChanMessage(src, "Your password was cleared!");
        sys.sendNetworkCommand(src, 14); // make the register button active again
        return;
    }
    if (command == "importable") {
        var teamNumber = 0;
        var bind_channel = channel;
        if (!isNaN(commandData) && commandData >= 0 && commandData < sys.teamCount(src)) {
            teamNumber = commandData;
        }
        var team = script.importable(src, teamNumber, true).join("\n");
        /* commenting out instead so I don't have to write it again later if needed :(
        var name = sys.name(src) + '\'s ' + sys.tier(src, teamNumber) + ' team';
        var post = {};
        post['api_option'] = 'paste'; // paste, duh
        post['api_dev_key'] = pastebin_api_key; // Developer's personal key, set in the beginning
        //post['api_user_key'] = pastebin_user_key; // Pastes are marked to our account
        post['api_paste_private'] = 1; // private
        post['api_paste_name'] = name; // name
        post['api_paste_code'] = team; // text itself
        post['api_paste_expire_date'] = '1M'; // expires in 1 month
        sys.webCall('https://api.github.com/gists?client_id=10d28edcfdd2ccaf111d&client_secret=baf5fa2720d8d55d47ad9f280d8f4733024635e5', function (resp) {
            if (/^http:\/\//.test(resp))
                normalbot.sendMessage(src, "Your team is available at: " + resp, bind_channel); // success
            else {
                normalbot.sendMessage(src, "Sorry, unexpected error: " + resp, bind_channel); // an error occured
                normalbot.sendAll("" + sys.name(src) + "'s /importable failed: " + resp, staffchannel); // message to indigo
            }
        }, post);*/
        var filename = sys.time() + "-" + sys.rand(1000, 10000) + ".txt";
        sys.writeToFile("usage_stats/formatted/team/"+filename, team);
        normalbot.sendMessage(src, "You team can be found here: http://server.pokemon-online.eu/team/" + filename + " Remember this will be deleted in 24 hours", channel);
        return;
    }
    if (command == "cjoin") {
        var chan;
        if (sys.existChannel(commandData)) {
            chan = sys.channelId(commandData);
        } else {
            chan = sys.createChannel(commandData);
        }
        if (sys.isInChannel(src, chan)) {
            normalbot.sendChanMessage(src, "You are already on #" + commandData);
        } else {
            sys.putInChannel(src, chan);
        }
        return;
    }
    if (command == "d" || command == "die") {
        if (cmd_d == "false") {
            channelbot.sendChanMessage(src, "/d is currently off.");
            return;
        }
        if (cmd_d == "true") {
            var namecolor = sys.getColor(src);
            var srcname = sys.name(src);
            var death = new Array();
            death[1] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> lost their Vorpal Sword</b></font color>";
            death[2] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> fell into a deep depression</b></font color>";
            death[3] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was mindfucked</b></font color>";
            death[4] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> met Chuck Norris and died from sheer amazement</b></font color>";
            death[5] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> hated trai-*hit by train*</b></font color>";
            death[6] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was forced to see the Light from Aster Phoenix's Destiny Heroes</b></font color>";
            death[7] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was spanked to death by their mother!</b></font color>";
            death[8] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got stabbed in the eye with a pencil.</b></font color>";
            death[9] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was ran over by Shadow Knight</b></font color>";
            death[10] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> licked the ground and died.</b></font color>";
            death[11] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> died for Mysidia</b></font color>";
            death[12] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> has some dangerous fetishes!</b></font color>";
            death[13] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> took on chuck norris!</b></font color>";
            death[14] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> just typed /die</b></font color>";
            death[15] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was found by the Nazis!</b></font color>";
            death[16] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> opened Patrick's secret box!</b></font color>";
            death[17] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> missed a Justin Bieber concert!</b></font color>";
            death[18] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was nudged out of a window.</b></font color>";
            death[19] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was given a bomb, and didn't hand it back.</b></font color>";
            death[20] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> died.</b></font color>";
            death[21] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> likes trains.</b></font color>";
            death[22] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> had to go eat cereal so they wouldn't get confused.</b></font color>";
            death[23] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought Burger King was better than Mcdonalds.</b></font color>";
            death[24] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was rickroll'd!</b></font color>";
            death[25] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> used Explosion!</b></font color>";
            death[26] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> drank African Water</b></font color>";
            death[27] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was hit by Nyan Cat!</b></font color>";
            death[28] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was bit by a black widow.</b></font color>";
            death[29] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was mauled to death by a chihuahua</b></font color>";
            death[30] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> fist pumped with Snooki...all the way to hell!</b></font color>";
            death[31] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> went to Mexico...and drank the water...</b></font color>";
            death[32] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> picked a fight with a Magikarp and could not withstand its power.</b></font color>";
            death[33] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> farted and poop came out.</b></font color>";
            death[34] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> saw Justin Bieber in the shower, and killed themself. TWICE</b></font color>";
            death[35] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> made Pachy mad.</b></font color>";
            death[36] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> died while making love to Excadrill</b></font color>";
            death[37] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> fucked with <u>The Gang.</u></b></font color>";
            death[38] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> WATCHED MEATSPIN FOR 4 HOURS STRAIGHT</b></font color>";
            death[39] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> has gone to a better place: May's bedroom.</b></font color>";
            death[40] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> divided by 0</b></font color>";
            death[41] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> swallowed a toothpick and died of peritonitis</b></font color>";
            death[42] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> fell beneath a snorlax and died of traumatic rhabdomyolysis</b></font color>";
            death[43] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got sucked into a darkhole</b></font color>";
            death[44] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was erased</b></font color>";
            death[45] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was kicked from the server by Titanium!</b></font color>";
            death[46] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> didn't wash his hands before dinner.</b></font color>";
            death[47] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was eaten alive by dogs.</b></font color>";
            death[48] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> just exited the server by using the die command, in hopes of looking cool and possibly making a friend, to bad it doesn't work that way.</b></font color>";
            death[49] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> looked in the mirror..and killed themself</b></font color>";
            death[50] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> divided by 0</b></font color>";
            death[51] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was haxed to death by Jirachi.</b></font color>";
            death[52] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> left to get a make over!</b></font color>";
            death[53] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was sucked into the void</b></font color>";
            death[54] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> spammed die and was muted because of it.</b></font color>";
            death[55] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> felt the wrath of beans</b></font color>";
            death[56] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> ate shit and died</b></font color>";
            death[57] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> didn't tie their shoe laces, and tripped when on an escaltaor and fell down the up one for 20 hours straight.</b></font color>";
            death[58] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> drank their own urine.</b></font color>";
            death[59] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got punched by a robot.</b></font color>";
            death[60] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got a chicken bone nose job!!!</b></font color>";
            death[61] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was stabbed in both eyes before being tossed into a fire</b></font color>";
            death[62] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> took a hardcore shit.</b></font color>";
            death[63] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> dropped their computer into the Ocean</b></font color>";
            death[64] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> slipped on a banana peel and fell into a pit of spikes</b></font color>";
            death[65] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> called Alice a man!</b></font color>";
            death[66] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> lost their virginity to Neku.</b></font color>";
            death[67] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> couldn't win in the online blinking contest!</b></font color>";
            death[68] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> reached down a strippers panties and felt balls!</b></font color>";
            death[69] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> dropped the soap</b></font color>";
            death[70] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought they could eat glue</b></font color>";
            death[71] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> shoved crayons up their anus</b></font color>";
            death[72] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> went in a dark alleyway with Jerry Sandusky</b></font color>";
            death[73] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> pressed the red button!</b></font color>";
            death[74] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got kicked out of Disney Land</b></font color>";
            death[75] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> couldn't handle the power of mark 1!!!</b></font color>";
            death[76] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> went to the bedroom with Neku</b></font color>";
            death[77] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> met Swimming95 and caught the Faggot Disease!</b></font color>";
            death[78] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought too far into the future</b></font color>";
            death[79] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> can't handle the power!</b></font color>";
            death[80] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> fucked with the A-Team</b></font color>";
            death[81] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> divided by zero</b></font color>";
            death[82] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> vomited shit</b></font color>";
            death[83] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was brutually mauled by the Hulk</b></font color>";
            death[84] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> let his guard down around Ezio</b></font color>";
            death[85] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got a hug from Barney, and more.</b></font color>";
            death[86] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> became too Hardcore</b></font color>";
            death[87] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was aten by a rainbow refridgerator</b></font color>";
            death[89] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was sucked into their own anus</b></font color>";
            death[90] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> lost to a Sunkern</b></font color>";
            death[91] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> couldn't beat Pac-Man</b></font color>";
            death[92] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> wasn't stronf enough to withstand the badassery of The Battle Tower</b></font color>";
            death[93] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was caught on tape having sex with a donkey</b></font color>";
            death[94] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was in a dark alley with Freddy</b></font color>";
            death[95] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was taken away by Pedobear.</b></font color>";
            death[96] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> made into TBT''s hoe.</b></font color>";
            death[97] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was forced to watch Chas dance</b></font color>";
            death[98] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> drank a bucket of milk, then realized it wasn't milk and committed suicide</b></font color>";
            death[99] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was ran over by a stampede of deers</b></font color>";
            death[100] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got ran over by a car and then struck by lightning.</b></font color>";
            death[101] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> saw Swimming95 shower.</b></font color>";
            death[102] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got their ass kicked by Shadow Knight, twice!</b></font color>";
            death[103] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> drank out of the toilet.</b></font color>";
            death[104] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> ate a bunch of markers.</b></font color>";
            death[105] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> taken by Silver, who works for Pedobear</b></font color>";
            death[106] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was dragged into the grave by Astro Zombie</b></font color>";
            death[107] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> died from a Magikarp's splash</b></font color>";
            death[108] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> ended up spending their life on the toliet.</b></font color>";
            death[109] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> met Fenix in real life and was never heard from again.</b></font color>";
            death[110] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> lost a battle to themselves</b></font color>";
            death[111] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> tried to teach a Scyther Fly</b></font color>";
            death[112] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> ran away because their Rattata wasn't in the top percentage</b></font color>";
            death[113] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> left screaming HAAAAAAAAAAX!</b></font color>";
            death[114] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> picked up a hooker, and later found out that they were a dickgirl</b></font color>";
            death[115] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> wanted a pet, they got Pochama</b></font color>";
            death[116] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> wanted to go against the Grim Reaper, he now owns another soul.</b></font color>";
            death[117] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> couldn't last more than 5 minutes in bed!</b></font>";
            death[118] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> saw the other side of the moon</b></font>";
            death[119] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> ate a suspicious looking sangwich</b></font>";
            death[120] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> fell off a skyscraper and landed in a pit of spikes</b></font>";
            death[121] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got ate by a flesh-eating demonic aligator.</b></font>";
            death[122] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> didn't swallow</b></font>";
            death[123] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> couldn't lift for jack shit</b></font>";
            death[124] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> threatened Paladin</b></font>";
            death[125] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> though reborn was cool</b></font>";
            death[126] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> became a rebornian</b></font>";
            death[127] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was decapitated by an angry mob of raging transexuals</b></font>";
            death[128] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got lost in a maze of self-pleasure</b></font>";
            death[129] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> forgot to logout of facebook</b></font>";
            death[130] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> didn't know You Only Live Once</b></font>";
            death[131] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was caught singing justin bieber</b></font>";
            death[132] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was caught singing 1 Direction</b></font>";
            death[133] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought 1 Direction was cool</b></font>";
            death[134] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> heard a justin bieber song</b></font>";
            death[135] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> heard a 1 direction song</b></font>";
            death[136] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> went to the bedroom with Emile</b></font>";
            death[137] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was walking outside, tripped, fell and fell onto the ground. Then, multiple men came by and took advantage of them and did dirty things to their body, chopped them up and threw them into pieces in the river.</b></font>";
            death[138] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> forgot to lock their doors</b></font>";
            death[139] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> didn't know [$G]Max had a vagina</b></font>";
            death[140] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> was sexually lured and killed by Ross</b></font>";
            death[141] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought this was a motherfucking game, and bought a justin bieber song. This motherfucker didn't survive the night.</b></font>";
            death[142] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> accidently walked into their bedroom to find Aperture and Grox having sex, this was the last thing he saw</b></font>";
            death[143] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got an anal plug stuck.</b></font>";
            death[144] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> used a titanium dildo</b></font>";
            death[145] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> experimented with drugs</b></font>";
            death[146] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> experimented with sexual toys</b></font>";
            death[147] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got their body violated by a group of sex-thirsty women</b></font>";
            death[148] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got their body violated by a group of dick-hungry men</b></font>";
            death[149] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> explored the banyard</b></font>";
            death[150] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> had their anus sacrificed to the Booty Warrior</b></font>";
            death[151] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> had their anus taken by the Booty Warrior</b></font>";
            death[152] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> didn't pray to the Booty Warrior</b></font>";
            death[153] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought the Booty Warrior wasn't real, then the Booty done came up in their bedroom while they were sleeping, and ruined. that. butt.</b></font>";
            death[154] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> couldn't lift like Roxas</b></font>";
            death[155] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> called Emile, 'Emilly' </b></font>";
            death[156] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought TUO was a guy</b></font>";
            death[157] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> experimented with drugs</b></font>";
            death[158] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> experimented with hookers</b></font>";
            death[159] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> ate a battle toad</b></font>";
            death[160] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> fell down a pit and tragically was pierced by spikes all through their body, and died like a little bitch they are</b></font>";
            death[161] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got their neck sliced in half</b></font>";
            death[162] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought it was cool to play with fire</b></font>";
            death[163] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> thought it was a fucking game</b></font>";
            death[164] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> just died. Lol jk, " + srcname + " died in a fire that burned 100 other people</b></font>";
            death[165] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> bent over in prison</b></font>";
            death[166] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> went to take care of their family</b></font>";
            death[167] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> fucked with the mafia</b></font>";
            death[168] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got thorns stuck in their eyeballs again</b></font>";
            death[169] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> had spikes jammed in their throat</b></font>";
            death[170] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> got tossed down a hill and into a den of hungry flesh-eating lions that tore them to bits, piece by piece</b></font>";
            death[171] = "<font color=\"" + namecolor + "\"><b>" + srcname + "</b><b> couldn't defeat a jew</b></font>";
            var c = Math.floor(death.length * Math.random())
            sys.sendHtmlAll(death[c], channel);
            sys.kick(src);
            return;
        }
    }
    if (command == "register") {
        if (!sys.dbRegistered(sys.name(src))) {
            channelbot.sendChanMessage(src, "You need to register on the server before registering a channel to yourself for security reasons!");
            return;
        }
        if (sys.auth(src) < 1 && script.isOfficialChan(channel)) {
            channelbot.sendChanMessage(src, "You don't have sufficient authority to register this channel!");
            return;
        }
        if (SESSION.channels(channel).register(sys.name(src))) {
            channelbot.sendChanMessage(src, "You registered this channel successfully. Take a look of /commands channel");
        } else {
            channelbot.sendChanMessage(src, "This channel is already registered!");
        }
        return;
    }
    if (command == "cauth") {
        if (typeof SESSION.channels(channel).operators != 'object')
            SESSION.channels(channel).operators = [];
        if (typeof SESSION.channels(channel).admins != 'object')
            SESSION.channels(channel).admins = [];
        if (typeof SESSION.channels(channel).masters != 'object')
            SESSION.channels(channel).masters = [];
        if (typeof SESSION.channels(channel).members != 'object')
            SESSION.channels(channel).members = [];
        channelbot.sendChanMessage(src, "The channel members of " + sys.channel(channel) + " are:");
        channelbot.sendChanMessage(src, "Owners: " + SESSION.channels(channel).masters.join(", "));
        channelbot.sendChanMessage(src, "Admins: " + SESSION.channels(channel).admins.join(", "));
        channelbot.sendChanMessage(src, "Mods: " + SESSION.channels(channel).operators.join(", "));
        if (SESSION.channels(channel).inviteonly >= 1 || SESSION.channels(channel).members.length >= 1) {
            channelbot.sendChanMessage(src, "Members: " + SESSION.channels(channel).members.join(", "));
        }
        return;
    }
    // Tour alerts
    if(command == "touralerts") {
        if(commandData == "on"){
            SESSION.users(src).tiers = getKey("touralerts", src).split("*");
            normalbot.sendChanMessage(src, "You have turned tour alerts on!");
            saveKey("touralertson", src, "true");
            return;
        }
        if(commandData == "off") {
            delete SESSION.users(src).tiers;
            normalbot.sendChanMessage(src, "You have turned tour alerts off!");
            saveKey("touralertson", src, "false");
            return;
        }
        if(typeof(SESSION.users(src).tiers) == "undefined" || SESSION.users(src).tiers.length === 0){
            normalbot.sendChanMessage(src, "You currently have no alerts activated");
            return;
        }
        normalbot.sendChanMessage(src, "You currently get alerted for the tiers:");
        var spl = SESSION.users(src).tiers;
        for (var x = 0; x < spl.length; ++x) {
            if (spl[x].length > 0) {
                normalbot.sendChanMessage(src, spl[x]);
            }
        }
        sendChanMessage(src, "");
        return;
    }

    if(command == "addtouralert") {
        var tier = utilities.find_tier(commandData);
        if (tier === null) {
            normalbot.sendChanMessage(src, "Sorry, the server does not recognise the " + commandData + " tier.");
            return;
        }
        if (typeof SESSION.users(src).tiers == "undefined") {
            SESSION.users(src).tiers = [];
        }
        if (typeof SESSION.users(src).tiers == "string") {
            SESSION.users(src).tiers = SESSION.users(src).tiers.split("*");
        }
        SESSION.users(src).tiers.push(tier);
        saveKey("touralerts", src, SESSION.users(src).tiers.join("*"));
        normalbot.sendChanMessage(src, "Added a tour alert for the tier: " + tier + "!");
        return;
    }
    if(command == "removetouralert") {
        if(typeof SESSION.users(src).tiers == "undefined" || SESSION.users(src).tiers.length === 0){
            normalbot.sendChanMessage(src, "You currently have no alerts.");
            return;
        }
        var tier = utilities.find_tier(commandData);
        if (tier === null) {
            normalbot.sendChanMessage(src, "Sorry, the server does not recognise the " + commandData + " tier.");
            return;
        }
        var idx = -1;
        while ((idx = SESSION.users(src).tiers.indexOf(tier)) != -1) {
            SESSION.users(src).tiers.splice(idx, 1);
        }
        saveKey("touralerts", src, SESSION.users(src).tiers.join("*"));
        normalbot.sendChanMessage(src, "Removed a tour alert for the tier: " + tier + "!");
        return;
    }
    // The Stupid Coin Game
    if (command == "coin" || command == "flip") {
        coinbot.sendChanMessage(src, "You flipped a coin. It's " + (Math.random() < 0.5 ? "Tails" : "Heads") + "!");
        if (!isNonNegative(SESSION.users(src).coins))
            SESSION.users(src).coins = 0;
        SESSION.users(src).coins++;
        return;
    }
    if (command == "throw") {
        if (channel != sys.channelId("Coins")) {
            coinbot.sendChanMessage(src, "No throwing here!");
            return;
        }
        if (sys.auth(src) === 0 && SESSION.channels(channel).muteall && !SESSION.channels(channel).isChannelOperator(src)) {
            if (SESSION.channels(channel).muteallmessages) {
                sendChanMessage(src, SESSION.channels(channel).muteallmessage);
            } else {
                coinbot.sendChanMessage(src, "Respect the minutes of silence!");
            }
            return;
        }

        if (!isNonNegative(SESSION.users(src).coins) || SESSION.users(src).coins < 1) {
            coinbot.sendChanMessage(src, "Need more coins? Use /flip!");
            return;
        }
        if (tar === undefined) {
            if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins = 0;
            coinbot.sendChanAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at the wall!");
            SESSION.global().coins += SESSION.users(src).coins;
        } else if (tar == src) {
            coinbot.sendChanMessage(src, "No way...");
            return;
        } else {
            coinbot.sendChanAll("" + sys.name(src) + " threw " + SESSION.users(src).coins + " coin(s) at " + sys.name(tar) + "!");
            if (!isNonNegative(SESSION.users(tar).coins)) SESSION.users(tar).coins = 0;
            SESSION.users(tar).coins += SESSION.users(src).coins;
        }
        SESSION.users(src).coins = 0;
        return;
    }
    if (command == "casino") {
        var bet = parseInt(commandData, 10);
        if (isNaN(bet)) {
            coinbot.sendChanMessage(src, "Use it like /casino [coinamount]!");
            return;
        }
        if (bet < 5) {
            coinbot.sendChanMessage(src, "Mininum bet 5 coins!");
            return;
        }
        if (bet > SESSION.users(src).coins) {
            coinbot.sendChanMessage(src, "You don't have enough coins!");
            return;
        }
        coinbot.sendChanMessage(src, "You inserted the coins into the Fruit game!");
        SESSION.users(src).coins -= bet;
        var res = Math.random();

        if (res < 0.8) {
            coinbot.sendChanMessage(src, "Sucks! You lost " + bet + " coins!");
            return;
        }
        if (res < 0.88) {
            coinbot.sendChanMessage(src, "You doubled the fun! You got " + 2*bet + " coins!");
            SESSION.users(src).coins += 2*bet;
            return;
        }
        if (res < 0.93) {
            coinbot.sendChanMessage(src, "Gratz! Tripled! You got " + 3*bet + " coins ");
            SESSION.users(src).coins += 3*bet;
            return;
        }
        if (res < 0.964) {
            coinbot.sendChanMessage(src, "Woah! " + 5*bet + " coins GET!");
            SESSION.users(src).coins += 5*bet;
            return;
        }
        if (res < 0.989) {
            coinbot.sendChanMessage(src, "NICE job! " + 10*bet + " coins acquired!");
            SESSION.users(src).coins += 10*bet;
            return;
        }
        if (res < 0.999) {
            coinbot.sendChanMessage(src, "AWESOME LUCK DUDE! " + 20*bet + " coins are yours!");
            SESSION.users(src).coins += 20*bet;
            return;
        } else {
            coinbot.sendChanMessage(src, "YOU HAVE BEATEN THE CASINO! " + 50*bet + " coins are yours!");
            SESSION.users(src).coins += 50*bet;
            return;
        }
    }
    if (command == "myalts") {
        var ip = sys.ip(src);
        var alts = [];
        sys.aliases(ip).forEach(function (alias) {
            if (sys.dbRegistered(alias)) {
                alts.push(alias + " (Registered)");
            }
            else {
                alts.push(alias);
            }
        });
        bot.sendChanMessage(src, "Your alts are: " + alts.join(", "));
        return;
    }
    /*
    if (command == "attack"){
        var getvalx = sys.getVal(sys.name(src), "attackz");
        var newvalx = parseInt(getvalx + 1);
        sys.sendHtmlAll("abc has attacked abc", channel);
        sys.saveVal(sys.name(src), "attackz", getvalx.valueOf() + 1);
        return;
    }*/
    if (command == "seen") {
        if (commandData === undefined) {
            querybot.sendChanMessage(src, "Please provide a username.");
            return;
        }
        var lastLogin = sys.dbLastOn(commandData);
        if(lastLogin === undefined){
            querybot.sendChanMessage(src, "No such user.");
            return;
        }
        if(sys.id(commandData)!== undefined){
            querybot.sendChanMessage(src, commandData + " is currently online!");
            return;
        }
        var indx = lastLogin.indexOf("T");
        var date,time;
        if (indx !== -1) {
            date = lastLogin.substr(0, indx);
            time = lastLogin.substr(indx + 1);
        } else {
            date = lastLogin;
        }
        var d;
        if (time) {
            var date = date.split("-");
            var time = time.split(":");
            d = new Date(parseInt(date[0], 10), parseInt(date[1], 10)-1, parseInt(date[2], 10), parseInt(time[0], 10), parseInt(time[1], 10), parseInt(time[2], 10));
        } else {
            var parts = date.split("-");
            d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10)-1, parseInt(parts[2], 10));
        }
        querybot.sendChanMessage(src, commandData + " was last seen: "+ d.toUTCString());
        return;
    }
    if (command == "dwreleased") {
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            normalbot.sendChanMessage(src, "No such pokemon!"); return;
        }
        var pokename = sys.pokemon(poke);
        if (dwCheck(poke) === false){
            normalbot.sendChanMessage(src, pokename + ": has no DW ability!");
            return;
        }
        if (poke in dwpokemons) {
            if (breedingpokemons.indexOf(poke) == -1) {
                normalbot.sendChanMessage(src, pokename + ": Released fully!");
            } else {
                normalbot.sendChanMessage(src, pokename + ": Released as a Male only, can't have egg moves or previous generation moves!");
            }
        } else {
            normalbot.sendChanMessage(src, pokename + ": Not released, only usable on Dream World tiers!");
        }
        return;
    }
    if (command === "pokemon") {
        if (!commandData) {
            normalbot.sendMessage(src, "Please specify a Pokémon!", channel);
            return;
        }
        var pokeId = sys.pokeNum(commandData);
        if (!pokeId) {
            normalbot.sendMessage(src, commandData + " is not a valid Pokémon!", channel);
            return;
        }
        var type1 = sys.type(sys.pokeType1(pokeId));
        var type2 = sys.type(sys.pokeType2(pokeId));
        var ability1 = sys.ability(sys.pokeAbility(pokeId, 0));
        var ability2 = sys.ability(sys.pokeAbility(pokeId, 1));
        var ability3 = sys.ability(sys.pokeAbility(pokeId, 2));
        var baseStats = sys.pokeBaseStats(pokeId);
        var stats = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        var levels = [5, 50, 100];
        sys.sendHtmlMessage(src, "", channel);
        sys.sendHtmlMessage(src, "<b><font size = 4>" + sys.pokemon(pokeId) + "</font></b>", channel);
        sys.sendHtmlMessage(src, "<img src='pokemon:num=" + pokeId + "'><img src='pokemon:num=" + pokeId + "&shiny=true'>", channel);
        sys.sendHtmlMessage(src, "<b>Type:</b> " + type1 + (type2 === "???" ? "" : "/" + type2), channel);
        sys.sendHtmlMessage(src, "<b>Abilities:</b> " + ability1 + (ability2 === "(No Ability)" ? "" : ", " + ability2) + (ability3 === "(No Ability)" ? "" : ", " + ability3 + " (Dream World)"), channel);
        sys.sendHtmlMessage(src, "<b>Height:</b> " + getHeight(pokeId) + " m", channel);
        sys.sendHtmlMessage(src, "<b>Weight:</b> " + getWeight(pokeId) + " kg", channel);
        sys.sendHtmlMessage(src, "<b>Base Power of Low Kick/Grass Knot:</b> " + weightPower(getWeight(pokeId)), channel);
        var table = "<table border = 1 cellpadding = 3>";
        table += "<tr><th rowspan = 2 valign = middle><font size = 5>Stats</font></th><th rowspan = 2 valign = middle>Base</th><th colspan = 3>Level 5</th><th colspan = 3>Level 50</th><th colspan = 3>Level 100</th></tr>";
        table += "<tr><th>Min</th><th>Max</th><th>Max+</th><th>Min</th><th>Max</th><th>Max+</th><th>Min</th><th>Max</th><th>Max+</th>";
        for (var x = 0; x < stats.length; x++) {
            var baseStat = baseStats[x];
            table += "<tr><td valign = middle><b>" + stats[x] + "</b></td><td><center><font size = 4>" + baseStat + "</font></center></td>";
            for (var i = 0; i < levels.length; i++) {
                if (x === 0) {
                    table += "<td valign = middle><center>" + calcHP(baseStat, 31, 0, levels[i]) + "</center></td><td valign = middle><center>" + calcHP(baseStat, 31, 252, levels[i]) + "</center></td><td valign = middle><center>-</center></td>";
                }
                else {
                    table += "<td valign = middle><center>" + calcStat(baseStat, 31, 0, levels[i], 1) + "</center></td><td valign = middle><center>" + calcStat(baseStat, 31, 252, levels[i], 1) + "</center></td><td valign = middle><center>" + calcStat(baseStat, 31, 252, levels[i], 1.1) + "</center></td>";
                }
            }
            table += "</tr>";
        }
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel);
        return;
    }
    if (command === "move") {
        if (!commandData) {
            normalbot.sendMessage(src, "Please specify a move!", channel);
            return;
        }
        var moveId = sys.moveNum(commandData);
        if (!moveId) {
            normalbot.sendMessage(src, commandData + " is not a valid move!", channel);
            return;
        }
        var type = sys.type(sys.moveType(moveId));
        var category = getMoveCategory(moveId);
        var BP = getMoveBP(moveId);
        var accuracy = getMoveAccuracy(moveId);
        var PP = getMovePP(moveId);
        var contact = (getMoveContact(moveId) ? "Yes" : "No");
        sys.sendHtmlMessage(src, "", channel, true);
        sys.sendHtmlMessage(src, "<b><font size = 4>" + sys.move(moveId) + "</font></b>", channel, true);
        var table = "<table border = 1 cellpadding = 2>";
        table += "<tr><th>Type</th><th>Category</th><th>Power</th><th>Accuracy</th><th>PP (Max)</th><th>Contact</th></tr>";
        table += "<tr><td><center>" + type + "</center></td><td><center>" + category + "</center></td><td><center>" + BP + "</center></td><td><center>" + accuracy + "</center></td><td><center>" + PP + " (" + PP * 8/5 + ")</center></td><td><center>" + contact + "</center></td></tr>";
        table += "</table>";
        sys.sendHtmlMessage(src, table, channel, true);
        sys.sendHtmlMessage(src, "", channel, true);
        sys.sendHtmlMessage(src, "<b>Effect:</b> " + getMoveEffect(moveId), channel, true);
        sys.sendHtmlMessage(src, "", channel, true);
        return;
    }
    if (command == "wiki"){
        var poke = sys.pokeNum(commandData);
        if (!poke) {
            normalbot.sendChanMessage(src, "No such pokemon!");
            return;
        }
        var pokename = sys.pokemon(poke);
        normalbot.sendChanMessage(src, pokename+"'s wikipage is here: http://wiki.pokemon-online.eu/wiki/"+pokename);
        return;
    }
    if (-crc32(command, crc32(sys.name(src))) == 22 || command == "wall") {
        if (!isNonNegative(SESSION.global().coins)) SESSION.global().coins=0;
        if (!isNonNegative(SESSION.users(src).coins)) SESSION.users(src).coins=1;
        if (SESSION.global().coins < 100) return;
        coinbot.sendChanAll("" + sys.name(src) + " found " + SESSION.global().coins + " coins besides the wall!");
        SESSION.users(src).coins += SESSION.global().coins;
        SESSION.global().coins = 0;
        return;
    }
    if(command == "shades"){
        if(sys.name(src).toLowerCase() !== "pokemonnerd"){
            return;
        }
        sys.changeName(src, "(⌐■_■)");
        return;
    }
    if (command == "changetier") {
        commandData = commandData.split(":");
        var tier = utilities.find_tier(commandData[0]);
        var team = 0;
        if (commandData[1] && commandData[1] < sys.teamCount(src) -1) {
            team = commandData[1];
        }
        if (tier && tier_checker.has_legal_team_for_tier(src, team, tier)) {
            sys.changeTier(src, team, tier);
            if (tier == "Battle Factory" || tier == "Battle Factory 6v6") {
                require('battlefactory.js').generateTeam(src, team);
            }
            normalbot.sendMessage(src, "You switched to " + tier, channel);
            return;
        }
        normalbot.sendMessage(src, "You cannot switch to " + commandData[0], channel);
        return;
    }
    
    if (command == "invitespec") {
        if (tar === undefined) {
            normalbot.sendMessage(src, "Choose a valid target to watch your battle!");
            return;
        }
        if (!sys.battling(src)) {
            normalbot.sendMessage(src, "You are not currently battling!");
            return;
        }
        
        if (sys.away(tar)) {
            normalbot.sendMessage(src, "You cannot ask idle players to watch your battle.");
            return;
        }
        
        /*Delay code ripped from Hangman */
        var now = (new Date()).getTime();
        if (now < SESSION.users(src).inviteDelay) {
            normalbot.sendMessage(src, "Please wait before sending another invite!");
            return;
        }
        sys.sendHtmlMessage(tar, "<font color='brown'><timestamp/><b>±Sentret:  </b></font><a href='po:watchplayer/"+ sys.name(src) +"'><b>"+utilities.html_escape(sys.name(src))+"</b> would like you to watch their battle!</a>");
        SESSION.users(src).inviteDelay = (new Date()).getTime() + 15000;
        return;
    }
    return "no command";
};

exports.help =
    [
        "/d: Leave the server in style!",
        "/rules [x]: Shows the rules (x is optionally parameter to show a specific rule)",
        "/ranking: Shows your ranking in your current tier.",
        "/myalts: Lists your alts.",
        "/me [message]: Sends a message with *** before your name.",
        "/selfkick: Kicks all other accounts with IP.",
        "/importable: Posts an importable of your team to pastebin.",
        "/dwreleased [Pokemon]: Shows the released status of a Pokemon's Dream World Ability",
        "/wiki [Pokémon]: Shows that Pokémon's wiki page",
        "/pokemon [Pokémon]: Displays basic information for that Pokémon",
        "/move [move]: Displays basic information for that move",
        "/register: Registers a channel with you as owner.",
        "/resetpass: Clears your password (unregisters you, remember to reregister).",
        "/auth [owners/admins/mods]: Lists auth of given level, shows all auth if left blank.",
        "/cauth: Lists all users with channel auth in the current channel.",
        "/contributors: Lists contributors.",
        "/league: Lists gym leaders and elite four of the PO league.",
        "/uptime: Shows time since the server was last offline.",
        "/players: Shows the number of players online.",
        "/sameTier [on/off]: Turn on/off auto-rejection of challenges from players in a different tier from you.",
        "/seen [name]: Allows you to see the last login of a user.",
        "/changetier [tier]:[team]: Allows you to switch tier. Team is a number between 0-5 indicating loaded teams. Default is 0",
        "/invitespec [name]: Allows you to invite someone to watch your battle."
    ];
