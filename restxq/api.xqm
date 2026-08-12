xquery version "3.1";

(:~
 : Swaradhyayan - Raaga Knowledge Module REST API
 : Runs as a BaseX RESTXQ module. All data comes from the "swaradhyayan"
 : database, which holds data/raagas.xml (see deploy instructions).
 :
 : Endpoints:
 :   GET /raagas                     list / filter / search raagas
 :   GET /raagas/{id}                full detail for one raaga
 :   GET /raagas/{id}/similar        resolved similar-raaga cards
 :   GET /meta/filters                distinct values for the filter dropdowns
 :)
module namespace api = "http://swaradhyayan.local/api";

import module namespace db = "http://basex.org/modules/db";

declare namespace rest = "http://exquery.org/ns/restxq";
declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";

declare %private variable $api:DB := "swaradhyayan";

(: ---------- helpers ---------- :)

declare %private function api:root() as element(raagas) {
  db:get($api:DB)/raagas
};

declare %private function api:by-id($id as xs:string) as element(raaga)? {
  api:root()/raaga[@id = $id]
};

(: short "card" shape, used in list results and similar-raaga cards :)
declare %private function api:summary($r as element(raaga)) as map(*) {
  map {
    "id": string($r/@id),
    "name": string($r/name),
    "thaat": string($r/thaat),
    "timeOfPerformance": string($r/timeOfPerformance),
    "rasa": string($r/rasa),
    "difficulty": string($r/difficulty)
  }
};

(: full detail shape for a single raaga page :)
declare %private function api:detail($r as element(raaga)) as map(*) {
  map {
    "id": string($r/@id),
    "name": string($r/name),
    "thaat": string($r/thaat),
    "jati": string($r/jati),
    "aroh": string($r/aroh),
    "avroh": string($r/avroh),
    "vadi": string($r/vadi),
    "samvadi": string($r/samvadi),
    "pakad": string($r/pakad),
    "chalan": string($r/chalan),
    "nyasSwar": string($r/nyasSwar),
    "varjitSwar": string($r/varjitSwar),
    "timeOfPerformance": string($r/timeOfPerformance),
    "season": string($r/season),
    "rasa": string($r/rasa),
    "difficulty": string($r/difficulty),
    "notesUsed": string($r/notesUsed),
    "practiceFriendly": string($r/practiceFriendly),
    "signatureNote": string($r/signatureNote),
    "compositions": array {
      for $c in $r/compositions/composition
      return map {
        "title": string($c/title),
        "type": string($c/type),
        "taal": string($c/taal),
        "source": string($c/source)
      }
    },
    "similarRaagas": array {
      for $s in $r/similarRaagas/similar
      let $target := api:by-id(string($s/@id))
      return map {
        "id": string($s/@id),
        "name": if ($target) then string($target/name) else string($s/@id),
        "relation": string($s/@relation)
      }
    },
    "learningTips": array {
      for $t in $r/learningTips/tip return string($t)
    },
    "guruQuote": map {
      "text": string($r/guruQuote),
      "author": string($r/guruQuote/@author)
    }
  }
};

(: ---------- endpoints ---------- :)

declare
  %rest:path("/raagas")
  %rest:GET
  %rest:query-param("q", "{$q}", "")
  %rest:query-param("thaat", "{$thaat}", "")
  %rest:query-param("time", "{$time}", "")
  %rest:query-param("mood", "{$mood}", "")
  %rest:query-param("difficulty", "{$difficulty}", "")
  %output:method("json")
function api:list-raagas(
  $q as xs:string, $thaat as xs:string, $time as xs:string,
  $mood as xs:string, $difficulty as xs:string
) as map(*) {
  let $results :=
    for $r in api:root()/raaga
    where ($q = "" or contains(lower-case($r/name), lower-case($q)))
      and ($thaat = "" or lower-case($r/thaat) = lower-case($thaat))
      and ($time = "" or contains(lower-case($r/timeOfPerformance), lower-case($time)))
      and ($mood = "" or contains(lower-case($r/rasa), lower-case($mood)))
      and ($difficulty = "" or lower-case($r/difficulty) = lower-case($difficulty))
    return api:summary($r)
  return map {
    "count": count($results),
    "results": array { $results }
  }
};

declare
  %rest:path("/raagas/{$id}")
  %rest:GET
  %output:method("json")
function api:get-raaga($id as xs:string) as item() {
  let $r := api:by-id($id)
  return
    if ($r) then api:detail($r)
    else (
      web:response-header(map { "status": 404, "message": "Not Found" }),
      map { "error": "No raaga found with id '" || $id || "'" }
    )
};

declare
  %rest:path("/raagas/{$id}/similar")
  %rest:GET
  %output:method("json")
function api:similar-raagas($id as xs:string) as item() {
  let $r := api:by-id($id)
  return
    if ($r) then
      map {
        "results": array {
          for $s in $r/similarRaagas/similar
          let $target := api:by-id(string($s/@id))
          let $base := if ($target) then api:summary($target) else map { "id": string($s/@id), "name": string($s/@id) }
          return map:merge(($base, map { "relation": string($s/@relation) }))
        }
      }
    else (
      web:response-header(map { "status": 404, "message": "Not Found" }),
      map { "error": "No raaga found with id '" || $id || "'" }
    )
};

declare
  %rest:path("/meta/filters")
  %rest:GET
  %output:method("json")
function api:filters() as map(*) {
  map {
    "thaats": array { distinct-values(api:root()/raaga/thaat) },
    "times": array { distinct-values(api:root()/raaga/timeOfPerformance) },
    "difficulties": array { distinct-values(api:root()/raaga/difficulty) }
  }
};
