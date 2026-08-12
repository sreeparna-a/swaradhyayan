xquery version "3.1";

(:~
 : Swaradhyayan - Dashboard module REST API
 : Data comes from dashboard.xml inside the "swaradhyayan" database, plus
 : cross-references into raagas.xml (via lib.xqm) for recent/recommended
 : raaga cards.
 :
 : Endpoint:
 :   GET /dashboard   full dashboard summary for the (single, dummy) student
 :)
module namespace dash = "http://swaradhyayan.local/dashboard";

import module namespace lib = "http://swaradhyayan.local/lib" at "lib.xqm";
import module namespace db = "http://basex.org/modules/db";

declare namespace rest = "http://exquery.org/ns/restxq";
declare namespace output = "http://www.w3.org/2010/xslt-xquery-serialization";

declare %private function dash:doc() as element(dashboard) {
  db:get($lib:DB, "dashboard.xml")/dashboard
};

declare
  %rest:path("/dashboard")
  %rest:GET
  %output:method("json")
function dash:get-dashboard() as map(*) {
  let $d := dash:doc()
  return map {
    "student": map {
      "name": string($d/student/name),
      "role": string($d/student/role),
      "level": string($d/student/level),
      "joined": string($d/student/joined)
    },
    "stats": array {
      for $s in $d/stats/stat
      return map {
        "id": string($s/@id),
        "label": string($s/@label),
        "value": string($s/@value),
        "unit": string($s/@unit),
        "icon": string($s/@icon)
      }
    },
    "courses": array {
      for $c in $d/courses/course
      return map {
        "id": string($c/@id),
        "title": string($c/title),
        "instructor": string($c/instructor),
        "progress": number($c/progress),
        "nextLesson": string($c/nextLesson)
      }
    },
    "assignments": array {
      for $a in $d/assignments/assignment
      return map {
        "id": string($a/@id),
        "title": string($a/title),
        "course": string($a/course),
        "due": string($a/due),
        "status": string($a/status)
      }
    },
    "recentRaagas": array {
      for $r in $d/recentRaagas/raaga
      return map:merge((
        lib:raaga-summary-by-id(string($r/@id)),
        map { "lastPracticed": string($r/@lastPracticed) }
      ))
    },
    "recommended": array {
      for $i in $d/recommended/item
      return map:merge((
        lib:raaga-summary-by-id(string($i/@id)),
        map { "reason": string($i/@reason) }
      ))
    }
  }
};
