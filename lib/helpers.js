var request = require('request');
var async = require('async');
var _ =require('underscore');
var async_max=10;//the hardest we will ever concurrently hit freebase


//non-front-facing methods that are used for the freebase javascript package

var fns={}


  //originally by david huynh 2010, http://www.freebase.com/appeditor/#!path=//cubed.dfhuynh.user.dev/index
  //Algorithm is adopted from
  //http://www.csse.monash.edu.au/~damian/papers/HTML/Plurals.html
  fns.singularize= function(text) {
    if(text.match(' ')) { //multiple words
      var words = text.split(' ');
      var last = words[words.length - 1];
      var firsts = words.slice(0, -1);
      return firsts.join(" ") + ' ' + fns.singularize(last);
    }
    var prepositions = {
      "about": 1,
      "above": 1,
      "across": 1,
      "after": 1,
      "against": 1,
      "along": 1,
      "among": 1,
      "around": 1,
      "at": 1,
      "before": 1,
      "behind": 1,
      "below": 1,
      "beneath": 1,
      "beside": 1,
      "between": 1,
      "beyond": 1,
      "but": 1,
      "by": 1,
      "despite": 1,
      "down": 1,
      "during": 1,
      "except": 1,
      "for": 1,
      "from": 1,
      "in": 1,
      "inside": 1,
      "into": 1,
      "like": 1,
      "near": 1,
      "of": 1,
      "off": 1,
      "on": 1,
      "onto": 1,
      "out": 1,
      "outside": 1,
      "over": 1,
      "past": 1,
      "since": 1,
      "through": 1,
      "throughout": 1,
      "till": 1,
      "to": 1,
      "toward": 1,
      "under": 1,
      "underneath": 1,
      "until": 1,
      "up": 1,
      "upon": 1,
      "with": 1,
      "within": 1,
      "without": 1
    };
    var userDefinedNouns = [{
      "p": "people",
      "s": "person"
    }, {
      "p": "tornadoes",
      "s": "tornado"
    }, {
      "p": "churches",
      "s": "church"
    }, {
      "p": "countries",
      "s": "country"
    }, {
      "p": "cities",
      "s": "city"
    }, {
      "p": "companies",
      "s": "company"
    }, {
      "p": "monkies",
      "s": "monkey"
    }, {
      "p": "donkies",
      "s": "donkey"
    }, {
      "p": "mysteries",
      "s": "mystery"
    }, {
      "p": "authors",
      "s": "author"
    }];

    // Table A.1
    var irregularNouns = {
      "beef": {
        anglicized: "beefs",
        classical: "beeves"
      },
      "brother": {
        anglicized: "brothers",
        classical: "brethren"
      },
      "child": {
        anglicized: null,
        classical: "children"
      },
      "cow": {
        anglicized: null,
        classical: "kine"
      },
      "ephemeris": {
        anglicized: null,
        classical: "ephemerides"
      },
      "genie": {
        anglicized: null,
        classical: "genii"
      },
      "money": {
        anglicized: "moneys",
        classical: "monies"
      },
      "mongoose": {
        anglicized: "mongooses",
        classical: null
      },
      "mythos": {
        anglicized: null,
        classical: "mythoi"
      },
      "octopus": {
        anglicized: "octopuses",
        classical: "octopodes"
      },
      "ox": {
        anglicized: null,
        classical: "oxen"
      },
      "soliloquy": {
        anglicized: "soliloquies",
        classical: null
      },
      "trilby": {
        anglicized: "trilbys",
        classical: null
      }
    };

    var uninflectedSuffixes = ["fish", "ois", "sheep", "deer", "pox", "itis"];

    // Table A.2
    var uninflectedNouns = {
      "bison": 1,
      "flounder": 1,
      "pliers": 1,
      "bream": 1,
      "gallows": 1,
      "proceedings": 1,
      "breeches": 1,
      "graffiti": 1,
      "rabies": 1,
      "britches": 1,
      "headquarters": 1,
      "salmon": 1,
      "carp": 1,
      "herpes": 1,
      "scissors": 1,
      "chassis": 1,
      "high-jinks": 1,
      "sea-bass": 1,
      "seabass": 1,
      "clippers": 1,
      "homework": 1,
      "series": 1,
      "cod": 1,
      "innings": 1,
      "shears": 1,
      "contretemps": 1,
      "jackanapes": 1,
      "species": 1,
      "corps": 1,
      "mackerel": 1,
      "swine": 1,
      "debris": 1,
      "measles": 1,
      "trout": 1,
      "diabetes": 1,
      "mews": 1,
      "tuna": 1,
      "djinn": 1,
      "mumps": 1,
      "whiting": 1,
      "eland": 1,
      "news": 1,
      "wildebeest": 1,
      "elk": 1,
      "pincers": 1,

      "moose": 1,
      "shrimp": 1,
      "hoi polloi": 1,
      "riffraff": 1,
      "rabble": 1
    };
    var inflectionCategories = [{ // Table A.10
      from: "a",
      to: "ae",
      words: ["alumna", "alga", "vertebra"]
    }, {
      // Table A.11
      from: "a",
      anglicized: "as",
      classical: "ae",
      words: ["abscissa", "amoeba", "antenna", "aurora", "formula", "hydra", "hyperbola", "lacuna", "medusa", "nebula", "nova", "parabola"]
    }, {
      // Table A.12
      from: "a",
      anglicized: "as",
      classical: "ata",
      words: ["anathema", "bema", "carcinoma", "charisma", "diploma", "dogma", "drama", "edema", "enema", "enigma", "gumma", "lemma", "lymphoma", "magma", "melisma", "miasma", "oedema", "sarcoma", "schema", "soma", "stigma", "stoma", "trauma"]
    }, {
      // Table A.13
      from: "en",
      anglicized: "ens",
      classical: "ina",
      words: ["stamen", "foramen", "lumen"]
    }, {
      // Table A.14
      from: "ex",
      to: "ices",
      words: ["codex", "murex", "silex"]
    }, {
      // Table A.15
      from: "ex",
      anglicized: "exes",
      classical: "ices",
      words: ["apex", "cortex", "index", "latex", "pontifex", "simplex", "vertex", "vortex"]
    }, {
      // Table A.16
      from: "is",
      anglicized: "ises",
      classical: "ides",
      words: ["iris", "clitoris"]
    }, {
      // Table A.17
      from: "o",
      to: "os",
      words: ["albino", "archipelago", "armadillo", "commando", "ditto", "dynamo", "embryo", "fiasco", "generalissimo", "ghetto", "guano", "inferno", "jumbo", "lingo", "lumbago", "magneto", "manifesto", "medico", "octavo", "photo", "pro", "quarto", "rhino", "stylo"]
    }, {
      // Table A.18
      from: "o",
      anglicized: "os",
      classical: "i",
      words: ["alto", "basso", "canto", "contralto", "crescendo", "solo", "soprano", "tempo"]
    }, {
      // Table A.19
      from: "on",
      to: "a",
      words: ["aphelion", "asyndeton", "criterion", "hyperbaton", "noumenon", "organon", "perihelion", "phenomenon", "prolegomenon"]
    }, {
      // Table A.20
      from: "um",
      to: "a",
      words: ["agendum", "bacterium", "candelabrum", "datum", "desideratum", "erratum", "extremum", "stratum", "ovum"]
    }, {
      // Table A.21
      from: "um",
      anglicized: "ums",
      classical: "a",
      words: ["aquarium", "compendium", "consortium", "cranium", "curriculum", "dictum", "emporium", "enconium", "gymnasium", "honorarium", "interregnum", "lustrum", "maximum", "medium", "memorandum", "millenium", "minimum", "momentum", "optimum", "phylum", "quantum", "rostrum", "spectrum", "speculum", "stadium", "trapezium", "ultimatum", "vacuum", "velum"]
    }, {
      // Table A.22
      from: "us",
      anglicized: "uses",
      classical: "i",
      words: ["focus", "fungus", "genius", "incubus", "nimbus", "nucleolus", "radius", "stylus", "succubus", "torus", "umbilicus", "uterus"]
    }, {
      // Table A.23
      from: "us",
      anglicized: "uses",
      classical: "us",
      words: ["apparatus", "cantus", "coitus", "hiatus", "impetus", "nexus", "plexus", "prospectus", "sinus", "status"]
    }, {
      // Table A.24
      from: "",
      to: "i",
      words: ["afreet", "afrit", "efreet"]
    }, {
      // Table A.25
      from: "",
      to: "im",
      words: ["cherub", "goy", "geraph"]
    }];

    function suffix(text, s) {
      return text.length >= s.length && text.substring(text.length - s.length) == s;
    }

    function capIfCap(s, s2) {
      if(typeof s == "string") {
        var isCap = s2.charAt(0).toLowerCase() != s2.charAt(0);
        return isCap ? (s.charAt(0).toUpperCase() + s.substr(1)) : s;
      } else {
        var a = [];
        for(var i in s) {
          var s3 = s[i];
          a.push(capIfCap(s3, s2));
        }
        return a;
      }
    }
    function inflection(text, from, to) {
      return text.substring(0, text.length - from.length) + to;
    }
    function isOneOf(c, chars) {
      return chars.indexOf(c) >= 0;
    }
    function isVowel(c) {
      return isOneOf(c, "aeiou");
    }
    var text2 = text.toLowerCase();
    for(var o in userDefinedNouns) {
      if(userDefinedNouns[o].p == text) {
        return userDefinedNouns[o].s;
      }
    }
    for(var singular in irregularNouns) {
      var entry = irregularNouns[singular];
      if(entry.anglicized === text2 || entry.classical === text2) {
        return capIfCap(singular, text);
      }
    }
    for(var s in uninflectedSuffixes) {
      if(suffix(text2, s)) {
        return text;
      }
    }
    if(uninflectedNouns && uninflectedNouns[text2]) {
      return text;
    }
    var checkWords = function(from, to, words) {
      if(suffix(text, to)) {
        var prefix = text.substring(text.length - to.length);
        var text3 = prefix + entry.from;
        for(var word in words) {
          if(text3 === word) {
            return capIfCap(text3, text);
          }
        }
      }
      return null;
    }
    for(var e in inflectionCategories) {
      var entry = inflectionCategories[e];
      var text3 = ("to" in entry && checkWords(entry.from, entry.to, entry.words)) || ("anglicized" in entry && checkWords(entry.from, entry.anglicized, entry.words)) || ("classical" in entry && checkWords(entry.from, entry.classical, entry.words));

      if(text3 != null && typeof text3 == "string") {
        return text3;
      }
    }
    for(var prep in prepositions) {
      var n = text.indexOf(" " + prep + " ");
      if(n > 0) {
        var prefix = text.substring(0, n);
        var r = singularize(prefix);
        if(r != null) {
          return r + " " + prep + " " + text.substr(n + prep.length + 2);
        } else {
          return null;
        }
      }
      n = text.indexOf("-" + prep + "-");
      if(n > 0) {
        var prefix = text.substring(0, n);
        var r = singularize(prefix);
        if(r != null) {
          return r + "-" + prep + "-" + text.substr(n + prep.length + 2);
        } else {
          return null;
        }
      }
    }
    var j = text.lastIndexOf(" ");
    if(j > 0) {
      var r = singularize(text.substring(j + 1));
      if(r != null) {
        return text.substring(0, j + 1) + r;
      } else {
        return null;
      }
    }
    if(suffix(text, "xes") || suffix(text, "ses")) {
      return text.substring(0, text.length - 2);
    }
    if(suffix(text, "s") && !suffix(text, "ss")) {
      return text.substring(0, text.length - 1);
    }
    return text;
  }
  //console.log(fns.singularize("george soros"));
  //console.log(fns.singularize("mama cass"));


  //by spencer kelly (@spencermountain)
  fns.sentenceparser= function(text) {
    var tmp = text.split(/(\S.+?[.])(?=\s+|$)/g);
    var sentences = [];
    //join acronyms, titles
    for(var i in tmp) {
      if(tmp[i]) {
        tmp[i] = tmp[i].replace(/^\s+|\s+$/g, ''); //trim extra whitespace
        //join common abbreviations + acronyms
        if(tmp[i].match(/(^| )(mr|dr|llb|md|bl|phd|ma|ba|mrs|miss|misses|mister|sir|esq|mstr|jr|sr|st|lit|inc|fl|ex|eg|jan|feb|mar|apr|jun|aug|sept?|oct|nov|dec)\. ?$/i) || tmp[i].match(/[ |\.][a-z]\.?$/i)) {
          tmp[parseInt(i) + 1] = tmp[i] + ' ' + tmp[parseInt(i) + 1];
        } else {
          sentences.push(tmp[i]);
          tmp[i] = '';
        }
      }
    }
    //cleanup afterwards
    var clean = [];
    for(var i in sentences) {
      sentences[i] = sentences[i].replace(/^\s+|\s+$/g, ''); //trim extra whitespace
      if(sentences[i]) {
        clean.push(sentences[i]);
      }
    }
    return clean;
  }
  //console.log(fns.sentenceparser('Dr. calm is me. lkj'))

  //remove objects with a duplicate field from json
  fns.json_unique= function(x, field) {
    var newArray = new Array();
    label: for(var i = 0; i < x.length; i++) {
      for(var j = 0; j < newArray.length; j++) {
        if(newArray[j] && x[i] && newArray[j][field] == x[i][field]) continue label;
      }
      newArray[newArray.length] = x[i];
    }
    return newArray;
  }



  //handle rate-limited asynchronous freebase calls with a ending callback
  fns.doit_async= function(arr, fn, options, done) {
    //wrap them all in functions
    var function_list = arr.map(function(r,i) {
      return function(callback) {
        fn(r, options, function(r) {
          if(options.each_time){
            options.each_time(r, i)
          }
          callback(null, r);
        })
      }
    })
    //groups of async tasks in a synchonous task
    var all = fns.groups_of(function_list, async_max).map(function(f_group) {
      return function(callback) {
        async.parallel(f_group, callback);
      }
    })
    async.series(all, function(err, result) {
      //flatten it one level
      result=result.reduce(function(a, b) {
          return a.concat(b);
      });
      done(result)
    });
  }







  //turn freebase's silly $00 encoding into unicode
  fns.mql_unencode= function(x) {
    x = x.replace(/\$([0-9A-Fa-f]{4})/g, function(a, b) {
      return String.fromCharCode(parseInt(b, 16));
    });
    return x;
  }
  //console.log(fns.mql_unencode("K$00F6ppen_climate_classification"))


  //turn an array into smaller groups of arrays
  fns.groups_of= function(arr, group_length) {
    var all = []
    for(var i in arr) {
      if(i % group_length == 0) {
        all.push([arr[i]])
      } else {
        all[all.length - 1].push(arr[i])
      }
    }
    return all
  }

  fns.parseurl= function(str) {
    var o = {
      strictMode: false,
      key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
      q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
      },
      parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    },
    m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i = 14;
    while(i--) uri[o.key[i]] = m[i] || "";
    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function($0, $1, $2) {
      if($1) uri[o.q.name][$1] = $2;
    });
    return uri;
  }

  //turn options object into get paramaters
  fns.set_params= function(o) {
    var options=o;
    if(!options) {
      return ''
    }
    return Object.keys(options).map(function(v) {
      var val=options[v];
      if(_.isArray(options[v]) || _.isObject(options[v])) {
        val = encodeURIComponent(JSON.stringify(options[v]));
      }
      return v + '=' + val
    }).join('&')
  }



  fns.http= function(url, callback) {
    if(!url) {
      return callback({
        error: "bad url"
      })
    }
    request({
      uri: url,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:10.0) Gecko/20100101 Firefox/10.0"
      }
    }, function(error, response, body) {
      try {
        body = JSON.parse(body)
      } catch(e) {
        console.log(e)
        process.exit(0)
      }
      if(error || response.statusCode != 200) {
        console.log(error)
        process.exit(0)
        return callback({
          error: error
        })
      }
      return callback(body);
    })
  }

  fns.isin= function(word, arr) {
    return arr.some(function(v) {
      return v == word
    })
  }

module.exports=fns;