#!/bin/bash

server=cgregg@myth.stanford.edu
www_dir=WWW

# server=yourfiy4@server.yourfirstyearteaching.com
# www_dir=public_html

echo "Message:" && read msg && git commit -a -m "$msg" && git push && ssh $server "cd ${www_dir}/pyodide-webworkers && git pull"
