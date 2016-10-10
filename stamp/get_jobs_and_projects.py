#!/usr/bin/env python
import urllib, json

# retrieve jobs queue from Stampede and load json into 'data' variable
queueURL   = "https://portal.tacc.utexas.edu/commnq/stampede.tacc.utexas.edu/queue.json"
response   = urllib.urlopen( queueURL )
data       = json.loads( response.read() )

# keep track of project ID's and store each new project request
# into a running list called 'projects'
projectsDict   = {}

# only keep running jubs
for job in data["running"]:

    # if projectID already exists then append to jobs list of project,
    #  and move to next ID
    projectID = job["Extension"]["LocalAccount"]
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
        projectsDict[projectID] = project

    else:
        # append job to existing project in dictionary
        projectsDict[projectID]["jobs"].append(job)

# print out projects list to file
with open( 'projects.json', 'w' ) as outfile:
    json.dump( [projectsDict], outfile )
