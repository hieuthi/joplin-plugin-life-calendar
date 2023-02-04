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
  if (iso==null) { return null }
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
    elem.innerHTML = `<b>${period["sIso"]}</b> <b>${period["eIso"]}</b>`;
    if (period["icon"]){elem.innerHTML = elem.innerHTML + `<span class="icon">${period["icon"]}</span>`; }
    elem.innerHTML = elem.innerHTML + ` ${period["title"]}`;
    if (period["className"]){ elem.className = elem.className + " " + period["className"]; }
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

const MSHOUR = 3.6e+6;
const MSDAY  = MSHOUR*24;
const MSWEEK = MSDAY * 7;
function getEventIndex(ctype, startDate, eventDate) {
  var idx = 0;
  switch (ctype) {
    case "day":
      idx = Math.floor((eventDate.getTime()-startDate.getTime()) / MSDAY);
      break;
    case "week":
      idx = Math.floor((eventDate.getTime()-startDate.getTime()) / MSWEEK);
      break;
    case "month":
      idx = (eventDate.getFullYear() - startDate.getFullYear()) * 12 + (eventDate.getMonth() - startDate.getMonth());
      break;
    case "year":
      idx = eventDate.getFullYear() - startDate.getFullYear();
      break;
  }
  return idx;
}
function getEventTime(ctype, startDate, index) {
  var date = startDate;
  switch (ctype) {
    case "day":
      date = new Date(startDate.getTime() + index*MSDAY);
      break;
    case "week":
      date = new Date(startDate.getTime() + index*MSWEEK);
      break;
    case "month":
      var month = startDate.getMonth() + index;
      date = new Date(startDate.getFullYear() + Math.floor(month/12), month % 12, startDate.getDate());
      break;
    case "year":
      date = new Date(startDate.getFullYear() + index, startDate.getMonth(), startDate.getDate());
      break;
  }
  return date;
}

function floorEventDate(ctype, date) {
  var ret = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  switch (ctype) {
    case "day":
      break;
    case "week":
      ret = new Date(ret.getTime() - ret.getDay()*MSDAY)
      break;
    case "month":
      ret = new Date(ret.getFullYear(), ret.getMonth(), 1);
      break;
    case "year":
      ret = new Date(ret.getFullYear(), 0, 1);
      break;
  }
  return ret;
}

function makeLifeCalendar(calendar, options) {
  calendar.innerHTML = ''; // Clear element content

  var firstInfo = document.createElement("div");
  firstInfo.className = 'info';
  calendar.appendChild(firstInfo);
  calendar.appendChild(firstInfo.cloneNode());

  var ctype = options["type"] || "week";
  ctype = !["day", "week", "month", "year"].includes(ctype) ? "week" : ctype;
  var itype = "W"
  switch (ctype) {
    case "day"  : itype = "D"; break;
    case "week" : itype = "W"; break;
    case "month": itype = "M"; break;
    case "year" : itype = "Y"; break;
  }

  // Calculate time period

  var dob  = options["dob"]  ? isoStringToDate(options["dob"])       : isoStringToDate("1970-01-01");
  dob = options["startDate"] ? isoStringToDate(options["startDate"]) : dob;
  var [ byear, bmonth, bdate ] = [ dob.getFullYear(), dob.getMonth(), dob.getDate() ];
  var dodm = getEventTime(ctype, dob, 9999);

  var dod = options["lifespan"] ? new Date(byear+options["lifespan"],bmonth,bdate) : new Date(byear+5,bmonth,bdate);
  dod = options["duration"]     ? new Date(byear+options["duration"],bmonth,bdate) : dod;
  dod = options["dod"]          ? isoStringToDate(options["dod"])                  : dod;
  dod = options["endDate"]      ? isoStringToDate(options["endDate"])              : dod;
  dod = dod > dodm ? dodm : dod;

  const doba = floorEventDate(ctype, dob);
  const doda = floorEventDate(ctype, dod);
  const now  = new Date();

  // Prepare ages
  options["events"] = options["events"] || [];
  options["events"].push({
    "date" : dateToIsoString(now),
    "title": `Today`,
    "icon" : `>`
  });
  if (options["ages"]) {
    options["ages"].forEach(age => {
      var birthday = null;
      if (bmonth==1 && bdate==29 && age % 4 != 0){
        birthday = new Date(byear+age,1,28);
      } else {
        birthday = new Date(byear+age,bmonth,bdate);
      }
      options["events"].push({
        "date" : dateToIsoString(birthday),
        "title": `Turning ${age}`,
        "icon" : `${age}` 
      })
    })
  }

  const events = {}
  // Prepare events
  if (options["events"]) {
    options["events"].sort( (a,b) => {return a["date"] > b["date"] ? -1 : 1; })
    options["events"].forEach(item => {
      var edate = new Date(isoStringToDate(item["date"]).getTime()+MSHOUR*12); // Daylight Saving Time
      var idx   = getEventIndex(ctype, doba, edate);
      if (events[idx]){
        events[idx].push(item);
      } else {
        events[idx] = [item];
      }
    })
  }
  // Prepare periods
  const periods = []
  if (options["periods"]){
    options["periods"].sort( (a,b) => {return a["start"] > b["start"] ? -1 : 1})
    options["periods"].forEach(item => {
      var sDate = new Date(isoStringToDate(item["start"]).getTime() + MSHOUR + 1); // Daylight Saving Time
      var eDate = new Date(isoStringToDate(item["end"]).getTime() + MSHOUR*23 - 1); // Daylight Saving Time
      if (sDate && eDate){
        var title = item["title"];
        var className = item["className"] || null;
        var color = item["color"] || null;
        var backgroundColor = item["backgroundColor"] || null;
        var icon = item["icon"] || null;
        periods.push({"start": sDate, "end": eDate,
          "sIso": dateToIsoString(sDate), "eIso": dateToIsoString(eDate),
          "title": title, "color": color, "backgroundColor": backgroundColor, 
          "icon": icon, "className": className})
      }
    })
  }

  const children = [];

  const nowIdx  = getEventIndex(ctype, doba, now);
  const nItems  = getEventIndex(ctype, doba, doda) + 1;
  for (var i=0; i<nItems; i++){
    var dateStart = new Date(getEventTime(ctype, doba, i).getTime() + MSHOUR + 1);     // Daylight Saving Time
    var dateEnd   = new Date(getEventTime(ctype, doba, i+1).getTime() - MSHOUR - 1); // Daylight Saving Time

    var age = Math.abs((new Date(dateEnd.getTime() - dob.getTime())).getUTCFullYear()-1970); //Daulight Saving Time


    var info = {"events" : events[i] || [],
                "periods": [],
                "header" : `<b>${itype}${i.toString().padStart(4,'0')}</b> | ${dateToIsoString(dateStart)}~${dateToIsoString(dateEnd)} | Age: ${age}`};

    var item     = document.createElement("div");
    var itemspan = document.createElement("span");
    // Past, Present, and Future
    if ( i < nowIdx ) {
      item.className = 'life-item past';
    } else if ( i == nowIdx) {
      item.className = 'life-item present';
    } else {
      item.className = 'life-item future';
    }
    // innerHTML is set by event if available, else by period
    var innerHTML = null;
    // Prepare info events
    if (events[i]){
      var event = events[i][0]; 
      events[i].forEach(item => {
        if ((item["z-index"] || 0) > (event["z-index"] ||0)) {
          event = item;
        }
      })
      innerHTML = event["icon"] || event["title"][0];
      if (event["className"]){ itemspan.className = event["className"]; }
      if (event["color"]){ itemspan.style.color = event["color"]; }
      if (event["backgroundColor"]){ itemspan.style.backgroundColor = event["backgroundColor"]; }
    }

    // Periods
    var bgcolor = null;
    var stclass = null;
    periods.forEach(period => {
      if ( !(dateEnd<=period["start"] || dateStart>=period["end"]) ) {
        info["periods"].push(period);
        if (period["icon"] && innerHTML===null){ innerHTML = period["icon"]; }
        if (period["backgroundColor"] && bgcolor===null){ bgcolor = period["backgroundColor"]; }
        if (period["className"] && stclass===null){ stclass = period["className"]; }
      }
    });
    if (bgcolor){ item.style.backgroundColor = bgcolor; }
    if (stclass){ item.classList.add(stclass) }
    if (innerHTML){ itemspan.innerHTML = innerHTML; }


    itemspan.infoObj = info;
    itemspan.onmouseover = itemMouseOver;
    itemspan.onmouseout  = itemMouseOut;
    itemspan.onclick     = itemClick;

    item.appendChild(itemspan);
    calendar.appendChild(item);
  }
}