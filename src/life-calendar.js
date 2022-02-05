document.addEventListener('joplin-noteDidUpdate', buildCalendars );

if (/WebKit/i.test(navigator.userAgent)) { // sniff
    var _timer_life = setInterval(function() {
        if (/loaded|complete/.test(document.readyState)) {
            buildCalendars()
        }
    }, 10);
}

// Helpers functions
function dateToIsoString(date){
  var month = (date.getMonth()+1).toString();
  month = month.length == 1 ? '0' + month : month;
  return `${date.getFullYear()}-${month}-${date.getDate()}`
}

function isoStringToDate(iso) {
  var [yyyy, mm, dd] = iso.split('-');
  return new Date(yyyy, mm - 1, dd); 
}

function buildCalendars() {
  if (_timer_life) clearInterval(_timer_life);

  const calendars = document.getElementsByClassName('life-calendar');
  for (var i=0; i<calendars.length; i++){
    var calendar = calendars[i];
    try {
      var options = JSON.parse(calendar.textContent);
      makeLifeCalendar(calendar, options);
    } catch (e) {
      calendar.innerHTML = "Parsing Error";
      console.log("Error: " + e);
    }
  }
}

function makeLifeCalendar(calendar, options) {
  calendar.innerHTML = ''; // Clear element content

  // Calculate time period
  const MSWEEK = 8.64e+7 * 7;

  const dob  = new Date(isoStringToDate(options["dob"]) || isoStringToDate("1970-01-01"));
  const doba = new Date(dob.getTime() - dob.getDay()*8.64e+7);
  const byear  = dob.getFullYear();
  const bmonth = dob.getMonth();
  const bdate  = dob.getDate();

  var dod = null;
  if (options["dod"]) {
    dod = new Date(isoStringToDate(options["dod"]) || isoStringToDate("2070-01-01"));
  } else if (options["lifespan"]){
    dod = new Date(byear+options["lifespan"],bmonth,bdate);
  }
  const doda = new Date(dod.getTime() + (7-dod.getDay())*8.64e+7);

  // Prepare ages
  const events = {}
  if (options["ages"]) {
    options["ages"].forEach(age => {
      var birthday = null;
      if (bmonth==1 && bdate==29 && age % 4 != 0){
        birthday = new Date(byear+age,1,28);
      } else {
        birthday = new Date(byear+age,bmonth,bdate);
      }

      var weekIdx = Math.floor((birthday.getTime()-doba.getTime()) / MSWEEK);
      events[weekIdx] = [{ "date" : dateToIsoString(birthday),
                           "title": `turning ${age}`,
                           "icon" : `${age}` }]
    })
  }

  // Prepare events
  if (options["events"]) {
    options["events"].forEach(item => {
      var edate = new Date(item["date"]);
      var weekIdx = Math.floor((edate.getTime()-doba.getTime()) / MSWEEK);
      if (events[weekIdx]){
        events[weekIdx].push(item);
      } else {
        events[weekIdx] = [item];
      }
    })
  }

  const children = [];

  const now     = new Date();
  const curweek = Math.floor((now.getTime()-doba.getTime()) / MSWEEK);
  const nweek   = Math.ceil((doda.getTime()-doba.getTime()) / MSWEEK);
  for (var i=0; i<nweek; i++){
    var weekIdx = i;

    var week     = document.createElement("div");
    var weekspan = document.createElement("span");
    var weekinfo = document.createElement("div");
    weekinfo.className = "info"

    var dateStart = new Date(doba.getTime() + i*MSWEEK);
    var dateEnd   = new Date(doba.getTime() + (i+1)*MSWEEK - 1000)

    var age = Math.abs((new Date(dateEnd.getTime() - dob.getTime())).getUTCFullYear()-1970);

    // Past, Present, and Future
    if (i < curweek ) {
      week.className = 'life-week past';
    } else if ( i> curweek) {
      week.className = 'life-week future';
    } else {
      week.className = 'life-week present';
    }

    // Prepare info meta
    var info = document.createElement("div");
    info.innerHTML = `<b>W${i}</b>, from ${dateToIsoString(dateStart)} to ${dateToIsoString(dateEnd)}, Age: ${age}`;
    info.className = 'info-meta';
    weekinfo.appendChild(info);

    // Prepare info events
    if (events[weekIdx]){
      var weekEvents = events[weekIdx];
      var event = weekEvents[0]; 
      weekspan.innerHTML = event["icon"] || event["title"][0];
      if (event["color"]){
        weekspan.style.color = event["color"];
      }
      if (event["backgroundColor"]){
        weekspan.style.backgroundColor = event["backgroundColor"];
      }

      weekEvents.forEach(event => {
        var info = document.createElement("div");
        info.className = 'info-event';
        info.innerHTML = `<b>${event["date"]}</b> (${event["icon"] || event["title"][0]}) ${event["title"]}`
        if (event["color"]){
          info.style.color = event["color"];
        }
        if (event["backgroundColor"]){
          info.style.backgroundColor = event["backgroundColor"];
        }
        weekinfo.appendChild(info);
      })
    }

    week.appendChild(weekspan);
    week.appendChild(weekinfo);

    calendar.appendChild(week);
  }
}