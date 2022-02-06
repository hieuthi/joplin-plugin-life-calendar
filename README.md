# Life Calendar

This plugin renders yaml-based fenced code into a Life Calendar [inspired by Tim Urban's aarticle "Your Life in Weeks"](https://waitbutwhy.com/2014/05/life-weeks.html).

![screenshot](https://raw.githubusercontent.com/hieuthi/joplin-plugin-life-calendar/main/docs/life-calendar-v1.0.0-screenshot.png)

The purpose of Life Calendar is documenting the events in your life but there is nothing stopping you from using it for other purposes such as project management. The yaml-based syntax make it easy to export data to other format.

## Usage
You need to create a fenced code with `life` as language to render the calendar then input the events using the the follow template:
```
  - date : yyyy-mm-dd    # (required)
    title:               # (required) event title
    icon :               # (optional) event icon, use first character of title if icon is null
    className:           # (optional) css class of the event (color, background-color, etc.)
    color:               # (optional) overwrite color
    backgroundColor:     # (optional) overwrite background-color

```

The example below should demostrate all the supported features. It is recommended to intend the events block with spaces as yalm parser is quite sensitive. You may encounter parsing problems when typing with Joplin as it use tab for intending.

`````markdown
# 📆 Life Calendar

<style>
  .education { color:white !important; background-color:red !important; } 
</style>

- **Date of Birth**: 01/01/2020

```life
dob: 2020-01-01
# dod: 2026-01-01 # overwrite lifespan
lifespan: 4
ages: [1,2,3,4,5,6]
events:
  - date : 2021-06-12
    title: Got a Gold Medal
    icon : 🥇
    backgroundColor: green
  - date : 2021-06-10
    title: Another event in the same week
    color: yellow
  - date : 2021-03-28
    title: Random Event
    icon : 🎤
    color: black
    backgroundColor: '#6495ED'
  - date : 2021-01-03
    title: Birthday Party
    icon : 🎂
    color: black
    backgroundColor: hotpink
  - date : 2020-03-19
    title: First character used as icon
    backgroundColor: orange
    color: black
  - date : 2020-08-19
    title: Obtain Magician License
    icon : 🎩
    className: education
  - date : 2020-03-27
    title: Used explicit icon
    icon : '<b>F</b>'
    color: orange
    backgroundColor: black
  - date : 2020-01-01
    title: Date of Birth
    icon : 👶
    backgroundColor: transparent
```

`````

You can further customize the apperance using `userstyle.css`

## Acknowledgements
- Tim Urban for popularizing the [Your Life in Weeks Concept](https://waitbutwhy.com/2014/05/life-weeks.html)
- [Dylan N's Life Calendar Implementation](https://github.com/ngduc/life-calendar) which is a reference for this plugin.

## License
[MIT](https://raw.githubusercontent.com/hieuthi/joplin-plugin-life-calendar/main/LICENSE)