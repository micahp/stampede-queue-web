#!/usr/bin/env python
import urllib, json

# retrieve jobs queue from Stampede and load json into 'data' variable
queueURL   = "https://portal.tacc.utexas.edu/commnq/stampede.tacc.utexas.edu/queue.json"
response   = urllib.urlopen( queueURL )
data       = json.loads( response.read() )

# keep track of project ID's and store each new project request
# into a running list called 'projects'
projectIDS = []
projectsDict   = {}
projects   = []

# only keep running jubs
for job in data["running"]:

    # if projectID already exists then skip and move to next ID
    projectID = job["Extension"]["LocalAccount"]
    if projectID not in projectIDS:

        # append projectID to projectIDS to not request for again
        projectIDS.append( projectID )

        # set projectURL for project request
        projectURL = 'https://tas.tacc.utexas.edu/api/web/project?name=' + projectID

        # request project data and load JSON
        response   = urllib.urlopen( projectURL )
        project    = json.loads( response.read() )

        # print project["name"]
        # Add job to project's job list
        project["jobs"] = []
        project["jobs"].append(job)

        # append project to running list of project
        projects.append( project )
        projectsDict[projectID] = project
        #print(str(project) + '\n')

    else:

        x = projectIDS.index(projectID)
        projects[x]["jobs"].append(job)
        #print(str(project) + "\n")
        projectsDict[projectID] = project

# print out projects list to file
#projects = str(projects)
with open( 'projects', 'w' ) as outfile:
    json.dump( [projectsDict], outfile )