document.addEventListener('joplin-noteDidUpdate', buildCalendars );

var _life_pin = null;

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
  var day   = (date.getDate()).toString()
  month = month.length == 1 ? '0' + month : month;
  day   = day.length == 1 ? '0' + day : day;
  return `${date.getFullYear()}-${month}-${day}`
}

function isoStringToDate(iso) {
  var [yyyy, mm, dd] = iso.split('-');
  return new Date(yyyy, mm - 1, dd); 
}

function buildCalendars() {
  if (_timer_life) clearInterval(_timer_life);
  _life_pin = null;

  const calendars = document.getElementsByClassName('life-calendar');
  for (var i=0; i<calendars.length; i++){
    var calendar = calendars[i];
    try {
      var options = JSON.parse(calendar.textContent);
      setTimeout(makeLifeCalendar(calendar, options),60);
    } catch (e) {
      calendar.innerHTML = "Parsing Error";
      console.log("Error: " + e);
    }
  }
}

function renderInfo(infoElement, info) {
  var elem = document.createElement("div");
  elem.innerHTML = info["header"];
  elem.className = 'info-meta';
  infoElement.appendChild(elem);

  info["events"].forEach(event => {
    var elem = document.createElement("div");
    elem.className = 'info-event';
    elem.innerHTML = `<b>${event["date"]}</b> <span class="icon">${event["icon"] || event["title"][0]}</span> ${event["title"]}`
    if (event["className"]){ elem.className = elem.className + " " + event["className"]; }
    if (event["color"]){ elem.style.color = event["color"]; }
    if (event["backgroundColor"]){ elem.style.backgroundColor = event["backgroundColor"]; }
    infoElement.appendChild(elem);
  });
  info["periods"].forEach(period => {
    var elem = document.createElement("div");
    elem.className = 'info-period';
    elem.innerHTML = `<b>${period["sIso"]}</b> <b>${period["eIso"]}</b> ${period["title"]}`;
    if (period["color"]){ elem.style.color = period["color"]; }
    if (period["backgroundColor"]){ elem.style.backgroundColor = period["backgroundColor"]; }
    infoElement.appendChild(elem);
  })
}

function itemMouseOut() {
  var firstInfo  = this.parentElement.parentElement.firstChild;
  var secondInfo = firstInfo.nextSibling;
  secondInfo.classList.remove('visible')
  if (_life_pin !== null){
    firstInfo.classList.add('visible')
  }
}
function itemMouseOver() {
  var firstInfo  = this.parentElement.parentElement.firstChild;
  var secondInfo = firstInfo.nextSibling;
  secondInfo.innerHTML = '';
  secondInfo.classList.add('visible')
  renderInfo(secondInfo, this.infoObj);
  if (_life_pin !== null){
    firstInfo.classList.remove('visible');
  }
}
function itemClick() {
  var firstInfo  = this.parentElement.parentElement.firstChild;
  if (_life_pin == null){
    _life_pin = this.infoObj;
    firstInfo.innerHTML = '';
    firstInfo.classList.add('visible')
    renderInfo(firstInfo, this.infoObj);
  } else {
    firstInfo.classList.remove('visible');
    _life_pin = null;
  }
}

function makeLifeCalendar(calendar, options) {
  calendar.innerHTML = ''; // Clear element content

  var firstInfo = document.createElement("div");
  firstInfo.className = 'info';
  calendar.appendChild(firstInfo);
  calendar.appendChild(firstInfo.cloneNode());

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
  } else {
    dod = new Date(byear+80,bmonth,bdate);
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

  // Prepare periods
  const periods = []
  if (options["periods"]){
    options["periods"].forEach(item => {
      var sDate = new Date(item["start"]);
      var eDate = new Date(item["end"]);
      if (sDate && eDate){
        var title = item["title"];
        var color = item["color"] || null;
        var backgroundColor = item["backgroundColor"] || null;
        periods.push({"start": sDate, "end": eDate,
          "sIso": dateToIsoString(sDate), "eIso": dateToIsoString(eDate),
          "title": title, "color": color, "backgroundColor": backgroundColor})
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

    var info = {"events" : [],
                "periods": [],
                "header" : `<b>W${i.toString().padStart(4,'0')}</b> | ${dateToIsoString(dateStart)}~${dateToIsoString(dateEnd)} | Age: ${age}`};
    // Prepare info events
    if (events[weekIdx]){
      var weekEvents = events[weekIdx];
      var event = weekEvents[0]; 
      weekspan.innerHTML = event["icon"] || event["title"][0];
      if (event["className"]){ weekspan.className = event["className"]; }
      if (event["color"]){ weekspan.style.color = event["color"]; }
      if (event["backgroundColor"]){ weekspan.style.backgroundColor = event["backgroundColor"]; }
      info["events"] = weekEvents;
    }

    // Periods
    var bgcolor = null;
    periods.forEach(period => {
      if ( (dateStart>=period["start"] && dateStart<period["end"]) ||
            (dateEnd>=period["start"] && dateEnd<period["end"]) ){
        info["periods"].push(period);
        if (period["backgroundColor"]){
          bgcolor = period["backgroundColor"];
        }
      }
    })
    if (bgcolor){ week.style.backgroundColor = bgcolor; }

    weekspan.infoObj = info;
    weekspan.onmouseover = itemMouseOver;
    weekspan.onmouseout  = itemMouseOut;
    weekspan.onclick     = itemClick;

    week.appendChild(weekspan);
    calendar.appendChild(week);
  }
}