#!/usr/bin/env python
import urllib, json, pprint

# retrieve jobs queue from Stampede and load json into 'data' variable
queueURL   = "https://portal.tacc.utexas.edu/commnq/stampede.tacc.utexas.edu/queue.json"
response   = urllib.urlopen( queueURL )
data       = json.loads( response.read() )

# Dictionary ProjectID : Project
projectsDict   = {}

# Only keep running jubs
for job in data["running"]:

    # If projectID already exists then append to jobs list of project,
    #   and move to next ID
    # Cast from unicode to string so javascript can intepret it 
    projectID = str(job["Extension"]["LocalAccount"])
    #print(type(projectID))
    if projectID not in projectsDict:

        # set projectURL for project request
        projectURL = 'https://tas.tacc.utexas.edu/api/web/project?name=' + projectID

        # request project data and load JSON
        response   = urllib.urlopen( projectURL )
        project    = json.loads( response.read() )

        # Add job to project's job list
        project["jobs"] = []
        project["jobs"].append(job)

        # append project to running dictionary of project
        #projectsDict['"'+projectID+'"'] = project
        projectsDict[projectID] = project
        #pprint.pprint(projectsDict)

    else:
        # append job to existing project in dictionary
        #projectsDict['"'+projectID+'"']["jobs"].append(job)
        projectsDict[projectID]["jobs"].append(job)

# print out projects list to file
with open( 'projects.json', 'w' ) as outfile:
    json.dump( projectsDict, outfile )
