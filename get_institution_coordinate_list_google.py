#!/usr/bin/env python
# Faster than *_more_io.py when JSON has been cached
import urllib2, json, pprint, time
from googleplaces import GooglePlaces, types, lang

start = time.clock()

# retrieve jobs queue from Stampede and load json into 'data' variable
queueURL   = "https://portal.tacc.utexas.edu/commnq/stampede.tacc.utexas.edu/queue.json"
response   = urllib.urlopen( queueURL )
data       = json.loads( response.read() )

# keep track of project ID's and store each longitude, latitude
# coordinate in dictionary
locations_dict   = {}

# API key for Google geocoding API, to translate symbolic
# names to lattitude and longitude
APIKey = "AIzaSyBp00u007F3EOKFQm_5hiBZ6JrSqj0bJ-Q"
google_places = GooglePlaces(APIKey)

try:
    # Populate locations dictionary with dcached data
    with open("institution_locations_dict.json", "r") as institution_file:
        institution_data = json.load(institution_file)
        locations_dict = institution_data[0]
        pprint.pprint(institution_data)
        print("")
except IOError:
    print("Institution location JSON file not found.")
    print("")

# Whether the locations dictionary is empty after reading in file
dict_was_empty = False
if len(locations_dict) == 0:
    dict_was_empty = True

# only keep running jobs
for job in data["running"]:

    #print(job)
    #print("")

    # Account for missing key "LocalAccount" in job dictionary
    try:
        project_id = job["Extension"]["LocalAccount"]
    except KeyError:
        print("Job dict is missing requested key.")
        print("")
        continue
    
    # Check if project is in the dictionary
    project_id_present = False
    for institution in locations_dict:
        loc_stub = locations_dict[institution]
        if project_id in loc_stub["project_ids"]:
            project_id_present = True

    # Only do io I/O if project is not already in dictionary
    if not project_id_present:

        # set projectURL for project request
        projectURL = 'https://tas.tacc.utexas.edu/api/web/project?name=' + project_id

        # request project data and load JSON
        response   = urllib.urlopen( projectURL )
        project    = json.loads( response.read() )

        institution = project["pi_institution"]
        print(institution)
        print("")

        # Check whether institution is "Department...", "Red McCombs..." etc, do something
        # TO-DO

        if institution not in locations_dict:

            # Query google places text search for institution
            query_result = google_places.text_search(institution)

            places = query_result.places

            location = None

            # Check if query returned any results
            if len(places) > 0:
                # Only one place object should be returned
                place = places[0]

                # Unpack longitude and latitude
                location = {}
                location["lat"]  = str(place.geo_location["lat"])
                location["long"] = str(place.geo_location["lng"])

                # Add project id to location's list of ids
                try:
                    location["project_ids"].append(project_id)
                    # Create new array if it does not exist
                except KeyError:
                    location["project_ids"] = []
                    location["project_ids"].append(project_id)

                # Add coordinates to locations dictionary
                locations_dict[institution] = location
                print(location)
                print("")
            else:
                print("ERROR: Query for '" + str(institution) + "' returned no results.")
                print("")

            print(locations_dict)
            print("")

print(locations_dict)
print("")

# print out projects list to file
with open( 'institution_locations_dict.json', 'w' ) as outfile:
    json.dump( locations_dict, outfile )

end = time.clock()
print("Time elapsed: " + str(end - start))