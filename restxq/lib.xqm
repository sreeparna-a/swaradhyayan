xquery version "3.1";

(:~
 : Swaradhyayan - shared helpers.
 : All feature modules (api.xqm, dashboard.xqm, and future ones for Tala
 : Library / Compositions / etc.) live in the same BaseX database
 : ("swaradhyayan"), as separate documents (raagas.xml, dashboard.xml, ...).
 : This module centralises the bits every module needs: which DB to open,
 : and how to summarise a <raaga> element as a JSON-ready map.
 :)
module namespace lib = "http://swaradhyayan.local/lib";

import module namespace db = "http://basex.org/modules/db";

declare variable $lib:DB := "swaradhyayan";

declare function lib:raagas-doc() as element(raagas) {
  db:get($lib:DB, "raagas.xml")/raagas
};

declare function lib:raaga-by-id($id as xs:string) as element(raaga)? {
  lib:raagas-doc()/raaga[@id = $id]
};

(: short "card" shape - used by the raaga list, similar-raaga cards,
   and the dashboard's recent/recommended raaga cards :)
declare function lib:raaga-summary($r as element(raaga)) as map(*) {
  map {
    "id": string($r/@id),
    "name": string($r/name),
    "thaat": string($r/thaat),
    "timeOfPerformance": string($r/timeOfPerformance),
    "rasa": string($r/rasa),
    "difficulty": string($r/difficulty)
  }
};

(: same shape, but tolerant of a missing raaga (falls back to just the id) -
   handy when resolving loosely-linked references like dashboard recommendations :)
declare function lib:raaga-summary-by-id($id as xs:string) as map(*) {
  let $r := lib:raaga-by-id($id)
  return
    if ($r) then lib:raaga-summary($r)
    else map { "id": $id, "name": $id, "thaat": "", "timeOfPerformance": "", "rasa": "", "difficulty": "" }
};
