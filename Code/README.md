# Traffic-Simulator-1.0
Traffic Simulator 1.0

Installation and Environment Setup:

Required:
1. Python 3.5 (Flask does not yet support the newest version, 3.6)
  https://www.python.org/downloads/release/python-353/
Check version from Command prompt with " python -V "
Make sure pip installer was installed with " pip list " to see installed packages.

2. Git - Any Version
  https://git-scm.com/downloads

To clone source code:
1. Go to the github page for the project, and find the "Clone or Download" button on the right side of the page.
2. Copy the link to be able to clone the repo (only 'use ssh' if you are an advanced user)
3. In the folder you want to clone the git repo, use the git Gui or in the git bash:
  git clone <link>
  You may be asked to provide a username and password, in this case use your GitHub credentials.

To easily install all Required packages:
pip install -r requirements.txt

This will install each of the packages listed in that file: requirements.txt
It is found in this folder. When requiring a new python package in a file, it should be listed here.

(OPTIONAL PACKAGES) - Not required for running the API locally.
pyinstaller: used to create .exe files from the trafficSimFlask.py file.
virtualenv: used to create "environments" for local python package installation.

*******************************************************************************

Starting API:
1. From a command prompt, in api folder run: " python trafficSimFlask.py "
2. Leave this window open to keep the API running on " localhost:5000 "
* The SwiFastApi.exe runs a barebones version of the api, without any authorization.

Startng Leaflet simulator:
1. From a command prompt, in sim\leafySim run:
  a. For Windows: " python -m http.server "
  b. For Linux/Mac: " python -m SimpleHTTPServer "
2. In a browser, navigate to localhost:8000 to get to the web app.
