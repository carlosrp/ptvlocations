PTV locations
=============

Single-page app that shows Public Transport Victoria (PTV) stops around you. When clicking on a stop marker (Metro Train, Tram, Bus Stop, Regional Bus or Nightrider Bus), it will show the next services in that location (from the Timetable, not realtime information).

The app uses gelocation when it starts, to show stops around you. Afterwards, you can find locations around a specific address.

The Stops button will show a list of stations visible in the map; you can filter by name and click on on stop in the list to show the same timetable as shown when clicking on the stop marker.

Information about PTV stops and timetable is pulled via the PTV API (very well documented and works really great). Real-time information is restricted, so only scheduled services are shown.
