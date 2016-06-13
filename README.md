#PTV locations

##Description

Single-page app that shows Public Transport Victoria (PTV in Australia) stops around you. When clicking on a stop marker (Metro Train, Tram, Bus Stop, Regional Bus or Nightrider Bus), it will show the next services in that location (from the Timetable, not realtime information).

The app uses geolocation when it starts, to show stops around you. Afterwards, you can find locations around a specific address.

The Stops button will show a list of stations visible in the map; you can filter by name and click on a stop in the list to show the same timetable as shown when clicking on the stop marker.

Information about PTV stops and timetable is pulled via the PTV API (very well documented and works really great). Real-time information is restricted, so only scheduled services are shown.

##How to use it

1. Clone code from https://github.com/carlosrp/ptvlocations.git
2. Run simple web server (npm's htt-server or python -m SimpleHTTPServer) or open index.html
3. Initially, the app shows the stops around your location, if geolocation was successful, or in the Melbourne CBD, if it wasn't.
4. Click on any PTV location to show the next services in that stops
5. You can zoom and pan to see other stops around
6. Type in an address to go to that location and see PTV stops around there (provided it is in Victoria...)

##Some notes

* The PTV API is limited to return a maximum of 30 stations around a location;
  therefore, when zooming too far away, it will look a bit strange since it will show up to 30 stops around the center point.
* Since this app is for Victorian Public Transport, when you use it from elsewhere in the world you won't see much (if geolocation is successful). In that case, just use Victorian addresses, like:
    - Melbourne CBD
    - 390 St Kilda Rd, Melbourne
    - Chapel St, Prahran

##Future improvements

* Timetable API call is done with only 1 value returned, per service and direction; this is good at the CBD, so the InfoWindows are not huge, but not so good at the suburbs, where there would be room for 3-5 services. Is it possible to manage infoWindow size, so it can scroll in the CBD where there are many services?
* Tried to deploy this app into Github Pages and Google App Engine; unfortunately, both sites use HTTPS and won't allow AJAX requests done in HTTP (they don't work in HTTPS).
* Issues with Bootstrap grid layout in Safari (iOS and OS X)

(c) Carlos Rodriguez - Melbourne, Australia - 2016
